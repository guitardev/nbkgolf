import { NextResponse } from 'next/server';
import { db, Player } from '@/lib/googleSheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
    try {
        const players = await db.players.getAll();
        return NextResponse.json(players);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // For now, allow POST without admin check (for registration flow)
        // In production, you may want to require admin for direct player creation
        const body = await request.json();
        const newPlayer: Player = {
            id: Date.now().toString(), // Simple ID generation
            ...body,
        };
        await db.players.add(newPlayer);
        return NextResponse.json(newPlayer);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add player' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        // Check if user is admin
        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
        }

        const success = await db.players.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Player not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Player updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
        }

        // Check if user is admin
        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
        }

        const success = await db.players.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Player not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Player deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
    }
}
