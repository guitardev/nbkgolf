
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/googleSheets';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        log('🚀 Starting System Validation...');

        const TIMESTAMP = Date.now().toString();
        const TEST_COURSE = {
            id: `course_val_${TIMESTAMP}`,
            name: 'Validation Course',
            pars: Array(18).fill(4),
            distances: Array(18).fill(300)
        };
        const TEST_TOURNAMENT = {
            id: `tour_val_${TIMESTAMP}`,
            name: 'Validation Tournament',
            date: new Date().toISOString().split('T')[0],
            courseId: TEST_COURSE.id,
            status: 'active' as const,
            scoringSystem: 'stroke' as const
        };
        const TEST_PLAYER = {
            id: `player_val_${TIMESTAMP}`,
            name: 'Validation Bot',
            lineUserId: `line_${TIMESTAMP}`,
            handicap: 18,
            email: 'bot@test.com',
            phone: '0000000000'
        };

        // 1. Create Data
        await db.courses.add(TEST_COURSE);
        log('✅ Course Created');
        await db.tournaments.add(TEST_TOURNAMENT);
        log('✅ Tournament Created');
        await db.players.add(TEST_PLAYER);
        log('✅ Player Created');

        // 2. Register
        await db.tournamentPlayers.add({
            id: `reg_val_${TIMESTAMP}`,
            tournamentId: TEST_TOURNAMENT.id,
            playerId: TEST_PLAYER.id,
            team: 'Dev Team',
            registeredAt: new Date().toISOString(),
            status: 'confirmed'
        });
        log('✅ Registration Confirmed');

        // 3. Submit Scores (Horizontal Batch)
        const scores: Record<number, number> = {};
        for (let i = 1; i <= 18; i++) scores[i] = 4; // All Par
        await db.scores.upsert(TEST_TOURNAMENT.id, TEST_PLAYER.id, scores);
        log('✅ Scores Submitted (Batch)');

        // 4. Verify
        const fetched = await db.scores.getByTournament(TEST_TOURNAMENT.id);
        const myScores = fetched.filter(s => s.playerId === TEST_PLAYER.id);
        const total = myScores.reduce((sum, s) => sum + s.strokes, 0);

        log(`📊 Read Validation: ${myScores.length} holes, ${total} strokes.`);

        if (myScores.length === 18 && total === 72) {
            log('✅ INTEGRITY CHECK PASSED');
        } else {
            log('❌ INTEGRITY CHECK FAILED');
        }

        // 5. Cleanup
        await db.courses.delete(TEST_COURSE.id);
        await db.tournaments.delete(TEST_TOURNAMENT.id);
        await db.players.delete(TEST_PLAYER.id);
        log('🧹 Cleanup Complete');

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
}
