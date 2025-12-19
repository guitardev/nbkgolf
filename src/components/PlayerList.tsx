"use client";

import { useEffect, useState } from 'react';

interface Player {
    id: string;
    name: string;
    handicap: number;
    team: string;
}

export default function PlayerList() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/players')
            .then((res) => res.json())
            .then((data) => {
                setPlayers(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading players...</div>;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
                {players.map((player) => (
                    <li key={player.id}>
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-emerald-600 truncate">{player.name}</p>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        HCP: {player.handicap}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                        Team: {player.team || 'None'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
