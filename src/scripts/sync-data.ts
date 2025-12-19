import type { Player, TournamentPlayer } from '../lib/googleSheets';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing db
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Use require to prevent hoisting
const { db } = require('../lib/googleSheets');

async function syncData() {
    console.log('🔄 Starting Data Synchronization...');
    console.log(`Debug: Sheet ID is ${process.env.GOOGLE_SHEET_ID ? 'Present' : 'Missing'}`);
    console.log(`Debug: Service Email is ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing'}`);

    try {
        // 1. Fetch all data
        console.log('📊 Fetching data...');
        // Explicitly cast to internal types since 'db' is any from require
        const players: Player[] = await db.players.getAll();
        const registrations: TournamentPlayer[] = await db.tournamentPlayers.getAll();

        console.log(`✅ Found ${players.length} players and ${registrations.length} registrations.`);

        let updatesCount = 0;
        let linkedCount = 0;

        // 2. Process Registrations
        for (const reg of registrations) {
            let needsUpdate = false;
            let updatedReg = { ...reg };

            // A. Link Guest to Member
            if (!reg.playerId && reg.status !== 'withdrawn') {
                const matchedPlayer = players.find(p =>
                    (reg.guestEmail && p.email && p.email.toLowerCase() === reg.guestEmail.toLowerCase()) ||
                    (reg.guestPhone && p.phone && p.phone === reg.guestPhone)
                );

                if (matchedPlayer) {
                    console.log(`🔗 Linking Guest "${reg.guestName}" to Player "${matchedPlayer.name}"`);
                    updatedReg.playerId = matchedPlayer.id;
                    updatedReg.guestName = ''; // Clear guest info as they are now linked
                    updatedReg.guestEmail = '';
                    updatedReg.guestPhone = '';
                    updatedReg.status = 'registered'; // Update status to registered member
                    needsUpdate = true;
                    linkedCount++;
                }
            }

            // B. Sync Member Details (Team)
            if (updatedReg.playerId) {
                const player = players.find(p => p.id === updatedReg.playerId);
                if (player) {
                    // Update Team if different and present in profile
                    if (player.team && player.team !== updatedReg.team) {
                        console.log(`📝 Updating Team for "${player.name}": ${updatedReg.team} -> ${player.team}`);
                        updatedReg.team = player.team;
                        needsUpdate = true;
                    }
                }
            }

            // Perform Update if needed
            if (needsUpdate) {
                const success = await db.tournamentPlayers.update(reg.id, updatedReg);
                if (success) {
                    updatesCount++;
                } else {
                    console.error(`❌ Failed to update registration ${reg.id}`);
                }
            }
        }

        console.log('-----------------------------------');
        console.log(`🎉 Sync Complete!`);
        console.log(`🔗 Linked Guests: ${linkedCount}`);
        console.log(`📝 Updated Records: ${updatesCount}`);

    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
}

// Execute
syncData();
