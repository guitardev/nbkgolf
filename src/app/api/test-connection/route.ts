import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
    try {
        const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
        const processedKey = rawKey.replace(/\\n/g, '\n');

        console.log('Key Debug:', {
            rawLength: rawKey.length,
            processedLength: processedKey.length,
            firstLine: processedKey.split('\n')[0],
            hasNewline: processedKey.includes('\n'),
            rawHasEscapedNewline: rawKey.includes('\\n')
        });

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: processedKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
            return NextResponse.json({
                status: 'error',
                message: 'Missing environment variables',
                details: {
                    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
                    hasSheetId: !!SPREADSHEET_ID
                }
            }, { status: 500 });
        }

        // Try to get spreadsheet metadata
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Connected to Google Sheets successfully',
            title: response.data.properties?.title
        });

    } catch (error: any) {
        console.error('Connection Test Error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Failed to connect to Google Sheets',
            error: error.message,
            debug: {
                rawLength: (process.env.GOOGLE_PRIVATE_KEY || '').length,
                processedLength: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').length,
                firstLine: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').split('\n')[0]
            }
        }, { status: 500 });
    }
}

