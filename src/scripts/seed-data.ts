
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
const { db } = require('../lib/googleSheets');

async function seedData() {
    console.log('🌱 Seeding Data...');

    try {
        const timestamp = Date.now().toString();

        // 1. Create a Player
        const player = {
            id: `player_${timestamp}`,
            name: 'Test Member',
            lineUserId: `line_${timestamp}`,
            handicap: 10,
            team: 'Team Current',
            email: 'member@test.com',
            phone: '0812345678'
        };
        await db.players.add(player);
        console.log('✅ Added Player:', player.name);

        // 2. Create a Guest Registration (Should be linked)
        const guestReg = {
            id: `reg_guest_${timestamp}`,
            tournamentId: 'tour_1', // Dummy ID
            team: 'Team Guest',
            registeredAt: new Date().toISOString(),
            status: 'pending',
            guestName: 'Mr. Guest (Member)',
            guestPhone: '0812345678' // Matches Player
        };
        await db.tournamentPlayers.add(guestReg);
        console.log('✅ Added Guest Registration (Matching Phone)');

        // 3. Create a Member Registration with OLD Team (Should be updated)
        const memberReg = {
            id: `reg_member_${timestamp}`,
            tournamentId: 'tour_1',
            playerId: player.id,
            team: 'Team Old', // Mismatch
            registeredAt: new Date().toISOString(),
            status: 'registered'
        };
        await db.tournamentPlayers.add(memberReg);
        console.log('✅ Added Member Registration (Old Team)');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedData();
