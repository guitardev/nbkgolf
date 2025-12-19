
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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
            'Courses': ['id', 'name', 'pars', 'distances'], // distances is included
            'TournamentPlayers': ['id', 'tournamentId', 'playerId', 'team', 'registeredAt', 'status', 'guestName', 'guestEmail', 'guestPhone'],
            'Scores': ['tournamentId', 'playerId', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18']
        };

        const logs: string[] = [];

        for (const [sheetName, headers] of Object.entries(HEADERS)) {
            const range = `${sheetName}!A1:Z1`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [headers] }
            });
            logs.push(`✅ Updated ${sheetName} headers`);
        }

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
