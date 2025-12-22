
import * as dotenv from 'dotenv';
import path from 'path';
import { google } from 'googleapis';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup Auth (Duplicate from googleSheets.ts for standalone script)
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/^["']|["']$/g, '');
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

async function migrate() {
    console.log('🔄 Starting Migration: Adding Profile Picture Column...');

    try {
        // Read headers of Players sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Players!A1:H1', // Check up to H
        });

        const headers = response.data.values?.[0] || [];
        console.log('Current Headers:', headers);

        // Expected Headers: id, name, lineUserId, handicap, team, email, phone
        // We want to add: profilePicture at Column H (Index 7)

        if (headers.length >= 8 && headers[7] === 'profilePicture') {
            console.log('✅ Column already exists. Skipping.');
            return;
        }

        // Add Header to H1
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Players!H1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['profilePicture']],
            },
        });

        console.log('✅ Successfully added "profilePicture" header to Column H.');

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    }
}

migrate();
