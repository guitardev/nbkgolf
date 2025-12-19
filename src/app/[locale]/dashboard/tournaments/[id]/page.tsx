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
            <div className="min-h-screen bg-gray-50 py-8">
                <ToastContainer />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Link href="/dashboard/tournaments" className="text-emerald-600 hover:text-emerald-800 mb-4 inline-block">
                            &larr; {t('backToTournaments')}
                        </Link>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                                <p className="text-gray-500 mt-1">
                                    {course?.name} • {tournament.date}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    value={selectedPlayerId}
                                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                                >
                                    <option value="">{t('selectPlayer')}</option>
                                    {availablePlayers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddPlayer}
                                    disabled={!selectedPlayerId}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('addPlayer')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                        {t('player')}
                                    </th>
                                    {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                                        <th key={hole} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                            {hole}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('total')}
                                    </th>
                                </tr>
                                <tr>
                                    <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                        Par
                                    </th>
                                    {course?.pars.map((par, i) => (
                                        <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-12">
                                            {par}
                                        </th>
                                    ))}
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                                        {course?.pars.reduce((a, b) => a + b, 0)}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activePlayers.map((player) => (
                                    <tr key={player.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                                            {player.name}
                                        </td>
                                        {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                                            <td key={hole} className="px-1 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    className="w-10 text-center border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm p-1"
                                                    value={getScore(player.id, hole)}
                                                    onChange={(e) => handleScoreChange(player.id, hole, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                            {calculateTotal(player.id)}
                                        </td>
                                    </tr>
                                ))}
                                {activePlayers.length === 0 && (
                                    <tr>
                                        <td colSpan={20} className="px-6 py-4 text-center text-gray-500">
                                            {t('noPlayersAdded')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}
