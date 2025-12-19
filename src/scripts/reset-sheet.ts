import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local in root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

async function clearSheet(range: string) {
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range,
        });
        console.log(`✅ Cleared ${range}`);
    } catch (error) {
        console.error(`❌ Failed to clear ${range}:`, error);
    }
}

async function main() {
    console.log('🗑️  Resetting Google Sheets Data...');

    const ranges = [
        'Players!A2:Z',
        'Tournaments!A2:Z',
        'TournamentPlayers!A2:Z',
        'Scores!A2:Z',
        'Courses!A2:Z'
    ];

    for (const range of ranges) {
        await clearSheet(range);
    }

    console.log('✨ All data cleared successfully!');
}

main();
