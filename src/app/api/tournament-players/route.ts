import { NextResponse } from 'next/server';
import { db, TournamentPlayer } from '@/lib/googleSheets';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import type { NextRequest } from 'next/server';

// GET /api/tournament-players?tournamentId=xxx or ?playerId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');
        const playerId = searchParams.get('playerId');

        if (tournamentId) {
            const tournamentPlayers = await db.tournamentPlayers.getByTournament(tournamentId);
            return NextResponse.json(tournamentPlayers);
        }

        if (playerId) {
            const tournamentPlayers = await db.tournamentPlayers.getByPlayer(playerId);
            return NextResponse.json(tournamentPlayers);
        }

        // Return all if no filter
        const all = await db.tournamentPlayers.getAll();
        return NextResponse.json(all);
    } catch (error) {
        console.error('Error fetching tournament players:', error);
        return NextResponse.json({ error: 'Failed to fetch tournament players' }, { status: 500 });
    }
}

// POST /api/tournament-players - Register for a tournament (member or guest)
export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        const body = await request.json();
        const { tournamentId, playerId, team, guestName, guestEmail, guestPhone } = body;

        // Validate: need either playerId (member) or guestName (guest)
        if (!tournamentId) {
            return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
        }

        if (!playerId && !guestName) {
            return NextResponse.json({ error: 'Either playerId or guestName is required' }, { status: 400 });
        }

        // Check if player is already registered for this tournament
        if (playerId) {
            const existing = await db.tournamentPlayers.getByTournament(tournamentId);
            const alreadyRegistered = existing.find(tp => tp.playerId === playerId);

            if (alreadyRegistered) {
                return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 409 });
            }
        }

        const newTournamentPlayer: TournamentPlayer = {
            id: Date.now().toString(),
            tournamentId,
            playerId: playerId || undefined,
            guestName: guestName || undefined,
            guestEmail: guestEmail || undefined,
            guestPhone: guestPhone || undefined,
            team: team || '',
            registeredAt: new Date().toISOString(),
            status: playerId ? 'registered' : 'pending', // Guests start as pending
        };

        const success = await db.tournamentPlayers.add(newTournamentPlayer);

        if (!success) {
            return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
        }

        return NextResponse.json(newTournamentPlayer, { status: 201 });
    } catch (error) {
        console.error('Error registering for tournament:', error);
        return NextResponse.json({ error: 'Failed to register for tournament' }, { status: 500 });
    }
}

// PATCH /api/tournament-players?id=xxx - Update team or status
export async function PATCH(request: NextRequest) {
    try {
        // Get session from NextAuth - admin required for status updates
        const session = await getServerSession(authOptions);
        const body = await request.json();

        // If updating status, require admin
        if (body.status) {
            if (!session?.user) {
                return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
            }
            const userRole = (session.user as any).role;
            if (userRole !== 'admin') {
                return NextResponse.json({ error: 'Forbidden. Admin access required to update status.' }, { status: 403 });
            }
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const success = await db.tournamentPlayers.update(id, body);

        if (!success) {
            return NextResponse.json({ error: 'Failed to update or record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating tournament player:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// DELETE /api/tournament-players?id=xxx - Withdraw from tournament (admin only)
export async function DELETE(request: NextRequest) {
    try {
        // Get session from NextAuth - admin required for deletion
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const success = await db.tournamentPlayers.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to withdraw or record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error withdrawing from tournament:', error);
        return NextResponse.json({ error: 'Failed to withdraw' }, { status: 500 });
    }
}
