"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAPI } from '@/hooks/useAdminAPI';
import { useToast } from '@/hooks/useToast';
import AdminGuard from '@/components/AdminGuard';
import { Tournament, Player, Score, Course } from '@/lib/googleSheets';
import Link from 'next/link';

interface PageProps {
    params: { id: string; locale: string };
}

export default function TournamentManagePage({ params }: PageProps) {
    const { id } = params;
    const t = useTranslations('tournaments');
    const tCommon = useTranslations('common');
    const { addScore } = useAdminAPI();
    const { success, error, ToastContainer } = useToast();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [activePlayers, setActivePlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

    const fetchData = async () => {
        try {
            const [tournamentsRes, playersRes, scoresRes, coursesRes, tournamentPlayersRes] = await Promise.all([
                fetch('/api/tournaments'),
                fetch('/api/players'),
                fetch(`/api/scores?tournamentId=${id}`),
                fetch('/api/courses'),
                fetch(`/api/tournament-players?tournamentId=${id}`)
            ]);

            const tournamentsData: Tournament[] = await tournamentsRes.json();
            const playersData: Player[] = await playersRes.json();
            const scoresData: Score[] = await scoresRes.json();
            const coursesData: Course[] = await coursesRes.json();
            const tournamentPlayersData: any[] = await tournamentPlayersRes.json(); // Type loose for now or import

            // Filter out empty/invalid players
            const validPlayers = playersData.filter(p => p.id && p.id.trim() !== '');

            console.log('Fetched playersData FULL:', JSON.stringify(validPlayers, null, 2));
            console.log('Fetched scoresData FULL:', JSON.stringify(scoresData, null, 2));

            const currentTournament = tournamentsData.find(t => t.id === id);
            setTournament(currentTournament || null);

            if (currentTournament) {
                const currentCourse = coursesData.find(c => c.id === currentTournament.courseId);
                setCourse(currentCourse || null);
            }

            setAllPlayers(validPlayers);
            setScores(scoresData);

            // Determine active players based on scores OR registration
            const playerIdsWithScores = new Set(scoresData.map(s => s.playerId));
            const registeredPlayerIds = new Set(tournamentPlayersData.map((tp: any) => tp.playerId).filter(Boolean));

            const activePlayerIds = new Set([...Array.from(playerIdsWithScores), ...Array.from(registeredPlayerIds)]);

            const initialActivePlayers = validPlayers.filter(p => activePlayerIds.has(p.id));
            setActivePlayers(initialActivePlayers);
            console.log('Initial active players:', initialActivePlayers);

        } catch (err) {
            console.error('Error fetching data:', err);
            error(tCommon('error'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddPlayer = async () => {
        if (!selectedPlayerId) return;
        const playerToAdd = allPlayers.find(p => p.id === selectedPlayerId);
        if (playerToAdd && !activePlayers.find(p => p.id === playerToAdd.id)) {
            // Optimistic update
            setActivePlayers([...activePlayers, playerToAdd]);
            setSelectedPlayerId('');

            // Persist via dummy score (Hole 0)
            try {
                await addScore({
                    tournamentId: id,
                    playerId: playerToAdd.id,
                    hole: 0, // Dummy hole for persistence
                    strokes: 0,
                    par: 0
                });
                success(t('playerAdded'));
            } catch (err) {
                console.error('Failed to add player:', err);
                error(tCommon('error'));
                fetchData();
            }
        }
    };

    const handleScoreChange = async (playerId: string, hole: number, value: string) => {
        const strokes = parseInt(value);
        if (isNaN(strokes)) return;

        // Optimistic update
        const newScore: Score = {
            tournamentId: id,
            playerId,
            hole,
            strokes,
            par: course?.pars[hole - 1] || 4 // Default par 4 if not found
        };

        const existingScoreIndex = scores.findIndex(s => s.playerId === playerId && s.hole === hole);
        let newScores = [...scores];
        if (existingScoreIndex >= 0) {
            newScores[existingScoreIndex] = newScore;
        } else {
            newScores.push(newScore);
        }
        setScores(newScores);

        try {
            await addScore(newScore);
        } catch (err) {
            console.error("Failed to save score", err);
            error(tCommon('error'));
            // Revert on error (optional, but good practice)
            fetchData();
        }
    };

    const getScore = (playerId: string, hole: number) => {
        return scores.find(s => s.playerId === playerId && s.hole === hole)?.strokes || '';
    };

    const calculateTotal = (playerId: string) => {
        return scores
            .filter(s => s.playerId === playerId && s.hole > 0) // Ignore dummy hole 0
            .reduce((sum, s) => sum + s.strokes, 0);
    };

    if (isLoading) {
        return <div className="p-8 text-center">{tCommon('loading')}</div>;
    }

    if (!tournament) {
        return <div className="p-8 text-center">{t('notFound')}</div>;
    }

    const availablePlayers = allPlayers.filter(p => !activePlayers.find(ap => ap.id === p.id));
    console.log('Render - allPlayers:', allPlayers.length);
    console.log('Render - activePlayers:', activePlayers.length);
    console.log('Render - availablePlayers:', availablePlayers.length);

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
                <ToastContainer />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 sm:mb-8">
                        <Link href="/dashboard/tournaments" className="text-emerald-600 hover:text-emerald-800 mb-4 inline-flex items-center gap-1 font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            {t('backToTournaments')}
                        </Link>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tournament.name}</h1>
                                <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm sm:text-base">
                                    <span className="font-medium text-emerald-600">{course?.name}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{tournament.date}</span>
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <select
                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 pl-4 pr-10 appearance-none bg-white text-gray-900"
                                        value={selectedPlayerId}
                                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                                    >
                                        <option value="">{t('selectPlayer')}</option>
                                        {availablePlayers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddPlayer}
                                    disabled={!selectedPlayerId}
                                    className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    {t('addPlayer')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 w-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {t('player')}
                                        </th>
                                        {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                                            <th key={hole} className="px-2 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[60px]">
                                                {hole}
                                            </th>
                                        ))}
                                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-900 uppercase tracking-wider min-w-[80px] bg-gray-100">
                                            {t('total')}
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            Par
                                        </th>
                                        {course?.pars.map((par, i) => (
                                            <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-400">
                                                {par}
                                            </th>
                                        ))}
                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 bg-gray-100">
                                            {course?.pars.reduce((a, b) => a + b, 0)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {activePlayers.map((player) => (
                                        <tr key={player.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                {player.name}
                                            </td>
                                            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                                                <td key={hole} className="px-1 py-3 whitespace-nowrap text-center">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        min="1"
                                                        max="20"
                                                        className="w-12 h-12 sm:w-10 sm:h-10 text-center border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-medium p-0 shadow-sm transition-all bg-white text-gray-900"
                                                        value={getScore(player.id, hole)}
                                                        onChange={(e) => handleScoreChange(player.id, hole, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 whitespace-nowrap text-base font-bold text-emerald-700 text-center bg-gray-50">
                                                {calculateTotal(player.id)}
                                            </td>
                                        </tr>
                                    ))}
                                    {activePlayers.length === 0 && (
                                        <tr>
                                            <td colSpan={20} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    <p>{t('noPlayersAdded')}</p>
                                                    <p className="text-sm text-gray-400">Select a player above to start scoring</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
