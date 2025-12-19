
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

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

const EXPECTED_HEADERS: Record<string, string[]> = {
    'Players': ['id', 'name', 'lineUserId', 'handicap', 'team', 'email', 'phone'],
    'Tournaments': ['id', 'name', 'date', 'courseId', 'status', 'scoringSystem'],
    'Courses': ['id', 'name', 'pars', 'distances'],
    'TournamentPlayers': ['id', 'tournamentId', 'playerId', 'team', 'registeredAt', 'status', 'guestName', 'guestEmail', 'guestPhone'],
    'Scores': ['tournamentId', 'playerId', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18']
};

async function checkHeaders() {
    console.log('📋 Checking Sheet Headers...');

    try {
        const ranges = Object.keys(EXPECTED_HEADERS).map(name => `${name}!A1:Z1`);
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SPREADSHEET_ID,
            ranges,
        });

        const valueRanges = response.data.valueRanges || [];

        valueRanges.forEach((range, index) => {
            const sheetName = Object.keys(EXPECTED_HEADERS)[index];
            const actualHeaders = range.values ? range.values[0] : [];
            const expectedHeaders = EXPECTED_HEADERS[sheetName];

            console.log(`\n📄 Sheet: ${sheetName}`);

            // Check for missing
            const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));
            if (missing.length > 0) {
                console.log(`   ❌ Missing Headers: ${missing.join(', ')}`);
                console.log(`   👉 Recommended Action: Add these columns to row 1.`);
            } else {
                console.log(`   ✅ Headers OK`);
            }

            // Check for extra (optional, might be comments)
            const extra = actualHeaders.filter(h => !expectedHeaders.includes(h));
            if (extra.length > 0) {
                console.log(`   ⚠️  Extra Columns: ${extra.join(', ')}`);
            }
        });

    } catch (error) {
        console.error('❌ Check failed:', error);
    }
}

checkHeaders();
