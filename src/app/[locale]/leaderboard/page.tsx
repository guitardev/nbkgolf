"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Tournament, Player, Score, Course } from '@/lib/googleSheets';
import Header from '@/components/Header';
import { generateLeaderboard, LeaderboardEntry, ScoringSystem, getScoringSystemName } from '@/lib/scoringCalculator';

export default function LeaderboardPage() {
    const t = useTranslations('leaderboard'); // You might need to add this namespace
    const tCommon = useTranslations('common');

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'gross' | 'net' | 'points'>('gross');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [scoringSystem, setScoringSystem] = useState<ScoringSystem>('stroke');
    const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
    const locale = useTranslations('nav')('myTournaments') === 'รายการแข่งของฉัน' ? 'th' : 'en'; // Hack to detect locale if useLocale is not available, or just use next-intl hook

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch('/api/tournaments');
                const data: Tournament[] = await res.json();
                setTournaments(data);
                if (data.length > 0) {
                    const active = data.find(t => t.status === 'active') || data[0];
                    setSelectedTournamentId(active.id);
                }
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (!selectedTournamentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [playersRes, scoresRes, coursesRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch(`/api/scores?tournamentId=${selectedTournamentId}`),
                    fetch('/api/courses')
                ]);

                const playersData: Player[] = await playersRes.json();
                const scoresData: Score[] = await scoresRes.json();
                const coursesData: Course[] = await coursesRes.json();

                const tournament = tournaments.find(t => t.id === selectedTournamentId);
                let pars: number[] = Array(18).fill(4);
                let currentSystem: ScoringSystem = 'stroke';

                if (tournament) {
                    const currentCourse = coursesData.find(c => c.id === tournament.courseId);
                    setCourse(currentCourse || null);
                    if (currentCourse && currentCourse.pars) pars = currentCourse.pars;
                    currentSystem = tournament.scoringSystem || 'stroke';
                    setScoringSystem(currentSystem);

                    // Set default sort based on system
                    if (currentSystem === 'stableford') {
                        setSortBy('points');
                        setOrder('desc');
                    } else {
                        setSortBy('net');
                        setOrder('asc');
                    }
                }

                // Generate Leaderboard
                const entries = generateLeaderboard(playersData, scoresData, pars, currentSystem);
                setLeaderboard(entries);

            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedTournamentId, tournaments]);

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
        if (sortBy === 'gross') {
            return order === 'asc'
                ? a.grossScore - b.grossScore
                : b.grossScore - a.grossScore;
        } else if (sortBy === 'points') {
            return order === 'asc'
                ? a.points - b.points
                : b.points - a.points;
        } else {
            return order === 'asc'
                ? a.netScore - b.netScore
                : b.netScore - a.netScore;
        }
    });

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-900 text-white py-8 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                {t('title')}
                            </h1>
                            <p className="mt-2 text-gray-400">
                                {getScoringSystemName(scoringSystem, 'th')}
                            </p>
                        </div>
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-300">{t('totalPlayers')}</div>
                                <div className="text-2xl font-bold text-emerald-400">{leaderboard.length}</div>
                            </div>
                            <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-300">{t('averageGross')}</div>
                                <div className="text-2xl font-bold text-emerald-400">{leaderboard.length ? Math.round(leaderboard.reduce((sum, e) => sum + e.grossScore, 0) / leaderboard.length) : 0}</div>
                            </div>
                            {scoringSystem !== 'stableford' && (
                                <div className="bg-white bg-opacity-10 p-4 rounded-xl border border-gray-200">
                                    <div className="text-sm text-gray-300">{t('averageNet')}</div>
                                    <div className="text-2xl font-bold text-emerald-400">{leaderboard.length ? Math.round(leaderboard.reduce((sum, e) => sum + e.netScore, 0) / leaderboard.length) : 0}</div>
                                </div>
                            )}
                        </div>

                        <select
                            value={selectedTournamentId}
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white rounded-md focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2"
                        >
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6 flex gap-4 justify-center md:justify-start">
                        <button
                            onClick={() => {
                                setSortBy('gross');
                                setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            }}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${sortBy === 'gross' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            <svg className="inline w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                            </svg>
                            {t('gross')} {sortBy === 'gross' && (order === 'asc' ? '↑' : '↓')}
                        </button>

                        {scoringSystem === 'stableford' ? (
                            <button
                                onClick={() => {
                                    setSortBy('points');
                                    setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                }}
                                className={`px-4 py-2 rounded-full font-medium transition-colors ${sortBy === 'points' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                <svg className="inline w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('points')} {sortBy === 'points' && (order === 'asc' ? '↑' : '↓')}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setSortBy('net');
                                    setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                                }}
                                className={`px-4 py-2 rounded-full font-medium transition-colors ${sortBy === 'net' ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                <svg className="inline w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 5v14" />
                                </svg>
                                {t('net')} {sortBy === 'net' && (order === 'asc' ? '↑' : '↓')}
                            </button>
                        )}
                    </div>

                    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('pos')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{t('player')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">{t('thru')}</th>
                                        <th className={`px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider ${sortBy === 'gross' ? '' : 'opacity-40'}`}>
                                            {t('gross')}
                                        </th>

                                        {scoringSystem === 'stableford' ? (
                                            <th className={`px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider ${sortBy === 'points' ? '' : 'opacity-40'}`}>
                                                {t('points')}
                                            </th>
                                        ) : (
                                            <th className={`px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider ${sortBy === 'net' ? '' : 'opacity-40'}`}>
                                                {t('net')}
                                            </th>
                                        )}

                                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">{t('hcp')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('loading')}</td>
                                        </tr>
                                    ) : sortedLeaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">{t('noScores')}</td>
                                        </tr>
                                    ) : (
                                        sortedLeaderboard.map((entry, index) => (
                                            <>
                                                <tr
                                                    key={entry.player.id}
                                                    className={`hover:bg-gray-700/50 transition-colors cursor-pointer ${expandedPlayerId === entry.player.id ? 'bg-gray-700/50' : ''}`}
                                                    onClick={() => setExpandedPlayerId(expandedPlayerId === entry.player.id ? null : entry.player.id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                                                        {entry.rank || index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-2">
                                                        <span className="transform transition-transform duration-200">
                                                            {expandedPlayerId === entry.player.id ? '▼' : '▶'}
                                                        </span>
                                                        {entry.player.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">
                                                        {entry.thru}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-center">
                                                        {entry.grossScore > 0 ? entry.grossScore : '-'}
                                                    </td>

                                                    {scoringSystem === 'stableford' ? (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400 text-center">
                                                            {entry.points}
                                                        </td>
                                                    ) : (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400 text-center">
                                                            {entry.netScore > 0 ? entry.netScore : '-'}
                                                        </td>
                                                    )}

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center hidden md:table-cell">
                                                        {entry.handicap}
                                                    </td>
                                                </tr>
                                                {/* Expandable Scorecard Row */}
                                                {expandedPlayerId === entry.player.id && (
                                                    <tr key={`${entry.player.id}-expanded`}>
                                                        <td colSpan={6} className="px-0 py-0 border-b border-gray-700 bg-gray-800/50">
                                                            <div className="p-4 overflow-x-auto">
                                                                <div className="min-w-max">
                                                                    <div className="grid grid-cols-[100px_repeat(9,1fr)_repeat(9,1fr)] gap-y-2 text-center text-xs sm:text-sm">
                                                                        {/* Header Row */}
                                                                        <div className="text-left font-bold text-gray-400 pl-2">Hole</div>
                                                                        {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                                                                            <div key={h} className="font-bold text-gray-400">{h}</div>
                                                                        ))}

                                                                        {/* Par Row */}
                                                                        <div className="text-left font-medium text-gray-500 pl-2">Par</div>
                                                                        {course?.pars.map((p, i) => (
                                                                            <div key={i} className="text-gray-500">{p}</div>
                                                                        )) || Array(18).fill('-').map((_, i) => <div key={i}>-</div>)}

                                                                        {/* Score Row */}
                                                                        <div className="text-left font-bold text-emerald-400 pl-2">Score</div>
                                                                        {Array.from({ length: 18 }, (_, i) => i + 1).map(h => {
                                                                            const score = entry.holeScores?.[h] || 0;
                                                                            const par = course?.pars?.[h - 1] || 4;
                                                                            let scoreClass = 'text-gray-400';

                                                                            if (score > 0) {
                                                                                if (score < par) scoreClass = 'text-emerald-400 font-bold'; // Birdie or better
                                                                                else if (score === par) scoreClass = 'text-white'; // Par
                                                                                else if (score === par + 1) scoreClass = 'text-orange-400'; // Bogey
                                                                                else scoreClass = 'text-red-400'; // Double Bogey+
                                                                            }

                                                                            return (
                                                                                <div key={h} className={scoreClass}>
                                                                                    {score > 0 ? score : '-'}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
