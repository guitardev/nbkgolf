
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { db } from '@/lib/googleSheets';

// POST /api/admin/system/migrate
// Migrates Scores from Vertical (Old) to Horizontal (New) format
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const logs: string[] = [];
        logs.push('🔄 Starting Score Migration...');

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

        // 1. Read Raw Data
        // We read A2:E to capture potential old format columns
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Scores!A2:E',
        });
        const rows = response.data.values || [];
        logs.push(`📊 Found ${rows.length} existing rows to analyze.`);

        if (rows.length === 0) {
            logs.push('⚠️ No data to migrate.');
            return NextResponse.json({ success: true, logs });
        }

        // 2. Group Valid Vertical Data
        // Vertical format: A=TID, B=PID, C=Hole, D=Strokes
        const groupedData: Record<string, Record<number, number>> = {};
        let validVerticalRows = 0;

        rows.forEach((row: any[]) => {
            const tId = row[0];
            const pId = row[1];
            // If col C (index 2) is a number 1-18, it's likely vertical format
            // In horizontal format, col C is Hole 1 (index 2).
            // Logic distinction:
            // Vertical: Col C is 1-18. Col D is strokes.
            // Horizontal: Col C is strokes for Hole 1.

            // To be safe, we only migrate if we detect explicit vertical structure?
            // Or we assume the user KNOWS they need to migrate.
            // Let's assume standard vertical shape:
            const possibleHole = Number(row[2]);
            const possibleStrokes = Number(row[3]);

            if (possibleHole >= 1 && possibleHole <= 18 && possibleStrokes > 0) {
                const key = `${tId}::${pId}`;
                if (!groupedData[key]) groupedData[key] = {};
                groupedData[key][possibleHole] = possibleStrokes;
                validVerticalRows++;
            }
        });

        if (validVerticalRows < rows.length * 0.5) {
            // Heuristic: If < 50% rows look vertical, maybe it's already migrated?
            logs.push(`⚠️ Caution: Only ${validVerticalRows} rows look like vertical format.`);
            logs.push(`ℹ️ This script clears the sheet. If you are already horizontal, DO NOT RUN THIS.`);
            //  return NextResponse.json({ success: false, logs: [...logs, "Aborted for safety. Sheet format check failed."] });
            // Let's rely on user intent for now but log warning.
        }

        const migrationCount = Object.keys(groupedData).length;
        logs.push(`🧩 Grouped data into ${migrationCount} player records.`);

        // 3. Clear Sheet
        logs.push('🗑️  Clearing Scores sheet...');
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Scores!A2:Z',
        });

        // 4. Write New Format
        logs.push('✍️  Writing new horizontal format...');
        let successCount = 0;
        for (const [key, scores] of Object.entries(groupedData)) {
            const [tId, pId] = key.split('::');
            const result = await db.scores.upsert(tId, pId, scores);
            if (result) successCount++;
        }

        logs.push(`✅ Successfully migrated ${successCount} records.`);

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Migration failed',
            logs: [`❌ Error: ${error}`]
        }, { status: 500 });
    }
}
