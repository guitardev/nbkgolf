import { NextResponse } from 'next/server';
import { db, TournamentPlayer } from '@/lib/googleSheets';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, phone } = body;

        if (!email && !phone) {
            return NextResponse.json({ error: 'Email or Phone is required' }, { status: 400 });
        }

        const allPlayers = await db.tournamentPlayers.getAll();
        const tournaments = await db.tournaments.getAll();

        const results = allPlayers.filter(tp => {
            // Check if guest info matches
            if (email && tp.guestEmail && tp.guestEmail.toLowerCase() === email.toLowerCase()) return true;
            if (phone && tp.guestPhone && tp.guestPhone === phone) return true;
            return false;
        });

        // Enrich with tournament details
        const enrichedResults = results.map(tp => {
            const tournament = tournaments.find(t => t.id === tp.tournamentId);
            return {
                ...tp,
                tournamentName: tournament ? tournament.name : 'Unknown Tournament',
                tournamentDate: tournament ? tournament.date : 'N/A',
            };
        });

        return NextResponse.json(enrichedResults);
    } catch (error) {
        console.error('Error checking guest registration:', error);
        return NextResponse.json({ error: 'Failed to check registration' }, { status: 500 });
    }
}
