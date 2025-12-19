import { NextResponse } from 'next/server';
import { db, Score } from '@/lib/googleSheets';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
        return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
    }

    try {
        const scores = await db.scores.getByTournament(tournamentId);
        return NextResponse.json(scores);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Support both single score (legacy) and batch scores
        if (body.scores && body.playerId && body.tournamentId) {
            // Batch mode
            // Expected body: { tournamentId, playerId, scores: { 1: 4, 2: 5 } }
            await db.scores.upsert(body.tournamentId, body.playerId, body.scores);
            return NextResponse.json({ success: true });
        } else {
            // Legacy single mode
            const newScore: Score = { ...body };
            // For legacy calls, we still use the add adapter which calls upsert internally
            await db.scores.add(newScore);
            return NextResponse.json(newScore);
        }
    } catch (error) {
        console.error('Error posting score:', error);
        return NextResponse.json({ error: 'Failed to add score' }, { status: 500 });
    }
}
