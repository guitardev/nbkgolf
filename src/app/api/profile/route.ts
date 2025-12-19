import { NextResponse } from 'next/server';
import { db, Player } from '@/lib/googleSheets';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lineUserId = searchParams.get('lineUserId');

        if (!lineUserId) {
            return NextResponse.json({ error: 'Line User ID is required' }, { status: 400 });
        }

        const players = await db.players.getAll();
        const player = players.find(p => p.lineUserId === lineUserId);

        if (!player) {
            return NextResponse.json({ found: false }, { status: 404 });
        }

        return NextResponse.json({ found: true, player });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { lineUserId, name, email, phone, handicap, team } = body;

        if (!lineUserId || !name || !phone) {
            return NextResponse.json({ error: 'Missing required fields (Name and Phone are mandatory)' }, { status: 400 });
        }

        const players = await db.players.getAll();
        const existingPlayer = players.find(p => p.lineUserId === lineUserId);

        if (existingPlayer) {
            // Update existing player
            const updatedPlayer = {
                ...existingPlayer,
                name,
                email,
                phone,
                handicap: Number(handicap),
                team
            };
            await db.players.update(existingPlayer.id, updatedPlayer);
            return NextResponse.json({ success: true, player: updatedPlayer });
        } else {
            // Create new player
            const newPlayer: Player = {
                id: Date.now().toString(),
                name,
                lineUserId,
                email,
                phone,
                handicap: Number(handicap),
                team
            };
            await db.players.add(newPlayer);
            return NextResponse.json({ success: true, player: newPlayer });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
