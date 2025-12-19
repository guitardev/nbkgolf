
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // Double check admin role
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

        const logs: string[] = [];
        const ranges = [
            'Players!A2:Z',
            'Tournaments!A2:Z',
            'TournamentPlayers!A2:Z',
            'Scores!A2:Z',
            'Courses!A2:Z'
        ];

        for (const range of ranges) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId: SPREADSHEET_ID,
                range,
            });
            logs.push(`🗑️ Cleared ${range}`);
        }

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
