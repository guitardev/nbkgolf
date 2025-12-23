
import { NextResponse } from 'next/server';
import { db } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const issues: string[] = [];
        const warnings: string[] = [];

        // 1. Fetch All Data
        const players = await db.players.getAll();
        const tournaments = await db.tournaments.getAll();
        const tournamentPlayers = await db.tournamentPlayers.getAll();
        // const scores = await db.scores.getAll(); // Score logic is complex, maybe skip for now or verify later

        // 2. Validate Players
        const playerIds = new Set<string>();
        const lineUserIds = new Map<string, string[]>(); // lineUserId -> [playerIds]

        players.forEach(p => {
            // Check ID dupes
            if (playerIds.has(p.id)) {
                issues.push(`CRITICAL: Duelicate Player ID found: ${p.id} (${p.name})`);
            }
            playerIds.add(p.id);

            // Check Line ID dupes (The main suspect)
            if (p.lineUserId) {
                const normalizedLineId = p.lineUserId.trim();
                const existing = lineUserIds.get(normalizedLineId) || [];
                existing.push(p.id);
                lineUserIds.set(normalizedLineId, existing);
            }
        });

        // Report Line ID Dupes
        lineUserIds.forEach((pIds, lineId) => {
            if (pIds.length > 1) {
                const names = players.filter(p => pIds.includes(p.id)).map(p => `${p.name} (ID:${p.id})`).join(', ');
                issues.push(`CRITICAL: Duplicate LINE User ID '${lineId}' shared by players: ${names}`);
            }
        });

        // 3. Validate Tournaments
        const tournamentIds = new Set<string>();
        tournaments.forEach(t => {
            if (tournamentIds.has(t.id)) {
                issues.push(`CRITICAL: Duplicate Tournament ID found: ${t.id} (${t.name})`);
            }
            tournamentIds.add(t.id);
        });

        // 4. Validate Registrations (Orphans)
        tournamentPlayers.forEach(tp => {
            if (!tournamentIds.has(tp.tournamentId)) {
                warnings.push(`ORPHAN: Registration ID ${tp.id} refers to non-existent Tournament ID: ${tp.tournamentId}`);
            }
            if (tp.playerId && !playerIds.has(tp.playerId)) {
                warnings.push(`ORPHAN: Registration ID ${tp.id} refers to non-existent Player ID: ${tp.playerId}`);
            }
        });

        return NextResponse.json({
            status: 'completed',
            issueCount: issues.length,
            warningCount: warnings.length,
            issues,
            warnings,
            summary: {
                totalPlayers: players.length,
                totalTournaments: tournaments.length,
                totalRegistrations: tournamentPlayers.length
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to audit data', details: error }, { status: 500 });
    }
}
