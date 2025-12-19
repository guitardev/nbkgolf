'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Plus } from 'lucide-react';

interface Player {
    id: string;
    name: string;
    score: number;
    image?: string | null;
}

interface LeaderboardData {
    tournamentName: string | null;
    status: string;
    players: Player[];
}

export default function MiniLeaderboard() {
    const t = useTranslations('home.leaderboard');
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/leaderboard/home');
                const json = await res.json();
                if (json.status) {
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch mini leaderboard', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return null; // Or a skeleton if preferred

    // Logic: Always show 5 slots + 3 empty, or fill up to 8?
    // User asked for "Top 5 + Empty slots to wait for new players"
    // Let's ensure we have at least 8 circles total for a good scroll/row look.
    const players = data?.players || [];
    const emptySlotsCount = Math.max(3, 8 - players.length); // Minimum 3 empty slots, fill up to 8 items total
    const emptySlots = Array(emptySlotsCount).fill(null);

    return (
        <div className="w-full py-6 overflow-hidden">
            <div className="text-center mb-6">
                <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold mb-2">
                    {data?.tournamentName || t('waitingForSeason')}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{t('currentStandings')}</h3>
            </div>

            <div className="flex justify-start md:justify-center overflow-x-auto pb-8 px-4 gap-6 no-scrollbar snap-x">
                {/* Ranking Players */}
                {players.map((player, index) => (
                    <div
                        key={player.id}
                        className="flex-shrink-0 flex flex-col items-center gap-3 group snap-center"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px] shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    {player.image ? (
                                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-amber-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {index + 1}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                                {player.score > 0 ? `+${player.score}` : player.score}
                            </div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 max-w-[80px] truncate">
                            {player.name}
                        </span>
                    </div>
                ))}

                {/* Empty Slots */}
                {emptySlots.map((_, index) => (
                    <div
                        key={`empty-${index}`}
                        className="flex-shrink-0 flex flex-col items-center gap-3 group snap-center"
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors duration-300">
                            <Plus className="w-6 h-6 text-gray-300 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-400 group-hover:text-emerald-500">
                            {t('join')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
