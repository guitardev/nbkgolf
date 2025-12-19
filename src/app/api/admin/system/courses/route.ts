
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/googleSheets';

// POST /api/admin/system/courses
// Fixes course distances by forcing text format (quoting) to prevent Google Sheets leading/trailing zero truncation issues.
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const logs: string[] = [];
        logs.push('🔧 Starting Course Distance Fix...');

        // 1. Fetch all courses
        const courses = await db.courses.getAll();
        logs.push(`Found ${courses.length} courses.`);

        let updatedCount = 0;

        // 2. Iterate and Update
        for (const course of courses) {
            logs.push(`Checking: ${course.name}...`);

            // Even if data looks ok to us, we re-save it to ensure the Sheet has the ' quote prefix
            // The db.courses.update method now applies quotes automatically.

            const success = await db.courses.update(course.id, {
                // Pass existing data; the update method will re-serialize it with quotes
                pars: course.pars,
                distances: course.distances
            });

            if (success) {
                updatedCount++;
                logs.push(`   ✅ Re-saved successfully.`);
            } else {
                logs.push(`   ❌ Failed to update.`);
            }
        }

        logs.push(`✅ Finished. Updated ${updatedCount} courses.`);

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Course fix failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Fix failed',
            logs: [`❌ Error: ${error}`]
        }, { status: 500 });
    }
}
