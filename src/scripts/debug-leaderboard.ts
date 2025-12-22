
import * as dotenv from 'dotenv';
import path from 'path';
import { db } from '../lib/googleSheets';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugLeaderboard() {
    console.log('🔍 Debugging Leaderboard Data...');

    try {
        const players = await db.players.getAll();
        console.log(`Found ${players.length} players.`);

        console.log('--- Sample Players (Top 5) ---');
        players.slice(0, 5).forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, Pic: "${p.profilePicture || 'N/A'}"`);
        });

        // Check if any player has a pic
        const hasPic = players.filter(p => p.profilePicture);
        console.log(`\nTotal players with pictures: ${hasPic.length}`);

    } catch (error) {
        console.error('❌ Debug Failed:', error);
    }
}

debugLeaderboard();
