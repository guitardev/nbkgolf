
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use require to prevent hoisting
const { db } = require('../lib/googleSheets');

async function debugTournaments() {
    console.log('🔍 Checking Tournaments Data...\n');
    try {
        const tournaments = await db.tournaments.getAll();
        console.log(`Found ${tournaments.length} tournaments:`);
        tournaments.forEach((t: any) => {
            console.log(`- [${t.id}] ${t.name}: Status = "${t.status}"`);
        });
    } catch (error) {
        console.error('Error fetching tournaments:', error);
    }
}

debugTournaments();
