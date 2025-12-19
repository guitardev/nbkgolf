
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

const HEADERS = {
    'Players': ['id', 'name', 'lineUserId', 'handicap', 'team', 'email', 'phone'],
    'Tournaments': ['id', 'name', 'date', 'courseId', 'status', 'scoringSystem'],
    'Courses': ['id', 'name', 'pars', 'distances'],
    'TournamentPlayers': ['id', 'tournamentId', 'playerId', 'team', 'registeredAt', 'status', 'guestName', 'guestEmail', 'guestPhone'],
    'Scores': ['tournamentId', 'playerId', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18']
};

async function fixHeaders() {
    console.log('🔧 Fixing Sheet Headers...');

    try {
        for (const [sheetName, headers] of Object.entries(HEADERS)) {
            const range = `${sheetName}!A1:Z1`;

            // Note: This overwrites Row 1. Data starts at Row 2.
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [headers]
                }
            });

            console.log(`   ✅ Updated ${sheetName} headers: ${headers.join(', ')}`);
        }

        console.log('\n✨ All headers updated successfully!');

    } catch (error) {
        console.error('❌ Fix failed:', error);
    }
}

fixHeaders();
