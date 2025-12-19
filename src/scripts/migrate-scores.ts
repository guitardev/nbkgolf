
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing db
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Use require to prevent hoisting
const { db } = require('../lib/googleSheets');
const { google } = require('googleapis');

async function migrateScores() {
    console.log('🔄 Starting Score Migration (Vertical -> Horizontal)...');

    // 1. Manually fetch the *Raw* sheet data because db.scores.getAll is already updated to new logic!
    // We need to read the sheet assuming it MIGHT be mixed or explicitly read columns A-E.
    // Actually, if we just run this on a fresh/wiped sheet it's fine. 
    // But assuming we have data: 
    // Vertical format: A=TID, B=PID, C=Hole, D=Strokes

    // SETUP DIRECT SHEET ACCESS
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const formattedKey = privateKey.includes('\n') ? privateKey : privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: formattedKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

    try {
        // Read "Scores" sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Scores!A2:E', // Old format range
        });
        const rows = response.data.values || [];
        console.log(`📊 Found ${rows.length} existing rows.`);

        if (rows.length === 0) {
            console.log('⚠️ No data to migrate.');
            return;
        }

        // Group by Player & Tournament
        const groupedData: Record<string, Record<number, number>> = {};

        rows.forEach((row: any[]) => {
            const tId = row[0];
            const pId = row[1];
            const hole = Number(row[2]);
            const strokes = Number(row[3]);

            // Check if this looks like valid vertical data (Hole should be 1-18)
            if (hole >= 1 && hole <= 18 && strokes > 0) {
                const key = `${tId}::${pId}`;
                if (!groupedData[key]) groupedData[key] = {};
                groupedData[key][hole] = strokes;
            }
        });

        const migrationCount = Object.keys(groupedData).length;
        console.log(`🧩 Grouped into ${migrationCount} player records.`);

        // CLEAR SHEET
        console.log('🗑️  Clearing Scores sheet...');
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Scores!A2:Z',
        });

        // WRITE NEW FORMAT
        console.log('✍️  Writing new horizontal format...');
        for (const [key, scores] of Object.entries(groupedData)) {
            const [tId, pId] = key.split('::');
            await db.scores.upsert(tId, pId, scores);
            process.stdout.write('.');
        }

        console.log('\n✅ Migration Complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateScores();
