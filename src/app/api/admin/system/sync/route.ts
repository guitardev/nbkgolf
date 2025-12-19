
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/googleSheets';

export async function POST(request: Request) {
    // 1. Admin Check
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [players, registrations] = await Promise.all([
            db.players.getAll(),
            db.tournamentPlayers.getAll()
        ]);

        let updatesCount = 0;
        let linkedCount = 0;
        const logs: string[] = [];
        logs.push(`Found ${players.length} players, ${registrations.length} registrations.`);

        // Process
        for (const reg of registrations) {
            let needsUpdate = false;
            let updatedReg = { ...reg };

            // A. Link Guest
            if (!reg.playerId && reg.status !== 'withdrawn') {
                const matchedPlayer = players.find(p =>
                    (reg.guestEmail && p.email && p.email.toLowerCase() === reg.guestEmail.toLowerCase()) ||
                    (reg.guestPhone && p.phone && p.phone === reg.guestPhone)
                );

                if (matchedPlayer) {
                    updatedReg.playerId = matchedPlayer.id;
                    updatedReg.guestName = '';
                    updatedReg.guestEmail = '';
                    updatedReg.guestPhone = '';
                    updatedReg.status = 'registered';
                    needsUpdate = true;
                    linkedCount++;
                    logs.push(`Registered member ${matchedPlayer.name} found for guest registration.`);
                }
            }

            // B. Sync Team
            if (updatedReg.playerId) {
                const player = players.find(p => p.id === updatedReg.playerId);
                if (player) {
                    if (player.team && player.team !== updatedReg.team) {
                        updatedReg.team = player.team;
                        needsUpdate = true;
                    }
                }
            }

            if (needsUpdate) {
                const success = await db.tournamentPlayers.update(reg.id, updatedReg);
                if (success) updatesCount++;
            }
        }

        logs.push(`Sync Complete. Linked: ${linkedCount}, Updated: ${updatesCount}`);
        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
