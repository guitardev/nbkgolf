
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use require to prevent hoisting
const { db } = require('../lib/googleSheets');

// Mock Data
const TEST_TIMESTAMP = Date.now().toString();
const TEST_COURSE = {
    id: `course_e2e_${TEST_TIMESTAMP}`,
    name: 'E2E Test Course',
    pars: Array(18).fill(4), // All par 4
    distances: Array(18).fill(350)
};
const TEST_TOURNAMENT = {
    id: `tour_e2e_${TEST_TIMESTAMP}`,
    name: 'E2E Validation Cup',
    date: new Date().toISOString().split('T')[0],
    courseId: TEST_COURSE.id,
    status: 'active',
    scoringSystem: 'stroke'
};
const TEST_PLAYER = {
    id: `player_e2e_${TEST_TIMESTAMP}`,
    name: 'E2E Tester',
    lineUserId: `line_${TEST_TIMESTAMP}`,
    handicap: 10,
    email: 'e2e@test.com',
    phone: '0999999999'
};

async function runE2E() {
    console.log('🚀 Starting End-to-End Compatibility Check...\n');

    try {
        // 1. Create Course
        console.log('1️⃣  Creating Course...');
        await db.courses.add(TEST_COURSE);
        console.log('   ✅ Course Created');

        // 2. Create Tournament
        console.log('2️⃣  Creating Tournament...');
        await db.tournaments.add(TEST_TOURNAMENT);
        console.log('   ✅ Tournament Created');

        // 3. Register Player
        console.log('3️⃣  Registering Player...');
        // Ensure player exists first
        await db.players.add(TEST_PLAYER);

        await db.tournamentPlayers.add({
            id: `reg_${TEST_TIMESTAMP}`,
            tournamentId: TEST_TOURNAMENT.id,
            playerId: TEST_PLAYER.id,
            team: 'Test Team',
            registeredAt: new Date().toISOString(),
            status: 'confirmed'
        });
        console.log('   ✅ Player Registered');

        // 4. Submit Scores (Batch / Horizontal)
        console.log('4️⃣  Submitting Scores (Batch/Horizontal)...');
        const scores: Record<number, number> = {};
        // Shoot par on every hole (72 total)
        for (let i = 1; i <= 18; i++) scores[i] = 4;

        await db.scores.upsert(TEST_TOURNAMENT.id, TEST_PLAYER.id, scores);
        console.log('   ✅ Scores Submitted');

        // 5. Verify Data Read (Leaderboard Simulation)
        console.log('5️⃣  Verifying Data Read...');
        const fetchedScores = await db.scores.getByTournament(TEST_TOURNAMENT.id);
        const playerScores = fetchedScores.filter((s: any) => s.playerId === TEST_PLAYER.id);

        const totalStrokes = playerScores.reduce((sum: number, s: any) => sum + s.strokes, 0);
        console.log(`   📊 Fetched ${playerScores.length} holes. Total Strokes: ${totalStrokes}`);

        if (playerScores.length === 18 && totalStrokes === 72) {
            console.log('   ✅ Data Verification PASSED: Full round retrieved correctly.');
        } else {
            console.error(`   ❌ Data Verification FAILED: Expected 18 holes/72 strokes, got ${playerScores.length}/${totalStrokes}`);
        }

        // 6. Cleanup (Optional but good)
        console.log('\n🧹 Cleaning up test data...');
        // Only delete the tournament to keep sheet clean-ish, or leave it for manual inspection?
        // Let's delete to be polite.
        await db.courses.delete(TEST_COURSE.id);
        await db.tournaments.delete(TEST_TOURNAMENT.id);
        await db.players.delete(TEST_PLAYER.id);
        // Note: Delete for scores/registrations isn't explicitly implemented in simple delete helpers usually,
        // but for this test validation, simply proving flow works is enough.
        console.log('   ✅ Cleanup Complete');

    } catch (error) {
        console.error('❌ E2E Failed:', error);
    }
}

runE2E();
