import { NextResponse } from 'next/server';
import { db } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tournaments = await db.tournaments.getAll();

        // Priority: Active > Upcoming > Completed (Recent)
        let tournament = tournaments.find(t => t.status === 'active');
        if (!tournament) {
            tournament = tournaments
                .filter(t => t.status === 'upcoming')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        }
        // If still no tournament, maybe show the last completed one? 
        // Or just let it be empty for "Waiting for season". 
        // Let's stick to Active/Upcoming for "Live" feel, or fallback to ANY recent one if we want to show *something*.
        // User requested "Waiting for new players" if empty, so let's allow "no tournament" state.

        if (!tournament) {
            return NextResponse.json({
                tournamentName: null,
                players: [],
                status: 'idle'
            });
        }

        const scores = await db.scores.getByTournament(tournament.id);
        const allPlayers = await db.players.getAll();

        // simple aggregation (assuming Stroke play for simplicity in preview, or sum of points)
        // ideally we reuse the logic from `calculateLeaderboard` but for a mini-preview we can just sum strokes/points
        // Let's assume Stroke play for simplicity or reuse basic summing.

        const playerScores = new Map<string, number>();

        // This is a simplified calculation for the HOME page preview. 
        // It sums strokes relative to par for stroke play, or just raw scores if system is complex.
        // For distinct visual, let's just sum Total Strokes - Total Par (Over/Under)

        scores.forEach(score => {
            const current = playerScores.get(score.playerId) || 0;
            const relativeScore = score.strokes - score.par; // -1 for Birdie, 0 for Par
            playerScores.set(score.playerId, current + relativeScore);
        });

        const leaderboard = Array.from(playerScores.keys()).map(playerId => {
            const player = allPlayers.find(p => p.id === playerId);
            return {
                id: playerId,
                name: player?.name || 'Unknown',
                score: playerScores.get(playerId) || 0,
                image: player?.profilePicture || null
            };
        });

        // Sort by score (Lowest is best for stroke play)
        // If Stableford, Highest is best.
        if (tournament.scoringSystem === 'stableford' || tournament.scoringSystem === '36system') {
            leaderboard.sort((a, b) => b.score - a.score);
        } else {
            leaderboard.sort((a, b) => a.score - b.score);
        }

        return NextResponse.json({
            tournamentName: tournament.name,
            status: tournament.status,
            players: leaderboard.slice(0, 5) // Top 5
        });

    } catch (error) {
        console.error('Error fetching home leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
