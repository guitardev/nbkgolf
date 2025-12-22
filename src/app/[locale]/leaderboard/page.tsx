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
    const [expandedPlayerIds, setExpandedPlayerIds] = useState<Set<string>>(new Set());
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [filterTeam, setFilterTeam] = useState<string>('all');
    const [filterFlight, setFilterFlight] = useState<string>('all');
    const locale = useTranslations('nav')('myTournaments') === 'รายการแข่งของฉัน' ? 'th' : 'en'; // Hack to detect locale

    const fetchData = async (background = false) => {
        if (!selectedTournamentId) return;
        if (!background) setIsLoading(true);

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
            setLastUpdated(new Date());

        } catch (err) {
            console.error(err);
        } finally {
            if (!background) setIsLoading(false);
        }
    };

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

    // Auto Refresh Effect
    useEffect(() => {
        if (!selectedTournamentId) return;

        // Initial load
        fetchData();

        // Interval
        const interval = setInterval(() => {
            fetchData(true);
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [selectedTournamentId]);


    const sortedLeaderboard = useMemo(() => {
        let filtered = [...leaderboard];

        // Filter Team
        if (filterTeam !== 'all') {
            filtered = filtered.filter(e => (e.player.team || '') === filterTeam);
        }

        // Filter Flight
        if (filterFlight !== 'all') {
            filtered = filtered.filter(e => {
                const hcp = e.player.handicap || 0;
                if (filterFlight === 'A') return hcp <= 12;
                if (filterFlight === 'B') return hcp >= 13 && hcp <= 24;
                if (filterFlight === 'C') return hcp >= 25;
                return true;
            });
        }

        return filtered.sort((a, b) => {
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
    }, [leaderboard, sortBy, order, filterTeam, filterFlight]);

    const uniqueTeams = useMemo(() => {
        const teams = new Set(leaderboard.map(e => e.player.team).filter(Boolean));
        return Array.from(teams).sort();
    }, [leaderboard]);

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
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <button
                                    onClick={() => fetchData()}
                                    className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {t('refresh')}
                                </button>
                                <span>•</span>
                                <span>{t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}</span>
                            </div>
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

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-medium bg-gray-700 px-2 py-1 rounded">{t('filters')}</span>
                        </div>
                        <select
                            value={filterTeam}
                            onChange={(e) => setFilterTeam(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-sm text-white rounded-md focus:ring-emerald-500 focus:border-emerald-500 px-3 py-1.5"
                        >
                            <option value="all">{t('allTeams')}</option>
                            {uniqueTeams.map(team => (
                                <option key={team} value={team!}>{team}</option>
                            ))}
                        </select>
                        <select
                            value={filterFlight}
                            onChange={(e) => setFilterFlight(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-sm text-white rounded-md focus:ring-emerald-500 focus:border-emerald-500 px-3 py-1.5"
                        >
                            <option value="all">{t('allFlights')}</option>
                            <option value="A">Flight A (0-12)</option>
                            <option value="B">Flight B (13-24)</option>
                            <option value="C">Flight C (25+)</option>
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
                                        sortedLeaderboard.map((entry, index) => {
                                            const isExpanded = expandedPlayerIds.has(entry.player.id);
                                            return (
                                                <>
                                                    <tr
                                                        key={entry.player.id}
                                                        className={`hover:bg-gray-700/50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-700/50' : ''}`}
                                                        onClick={() => {
                                                            setExpandedPlayerIds(prev => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(entry.player.id)) {
                                                                    newSet.delete(entry.player.id);
                                                                } else {
                                                                    newSet.add(entry.player.id);
                                                                }
                                                                return newSet;
                                                            });
                                                        }}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                                                            {entry.rank || index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-2">
                                                            <span className="transform transition-transform duration-200">
                                                                {isExpanded ? '▼' : '▶'}
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
                                                    {isExpanded && (
                                                        <tr key={`${entry.player.id}-expanded`}>
                                                            <td colSpan={6} className="px-0 py-0 border-b border-gray-700 bg-gray-800/50">
                                                                <div className="p-4 overflow-x-auto">
                                                                    <div className="min-w-max">
                                                                        <div className="grid grid-cols-[100px_repeat(9,1fr)_repeat(9,1fr)] gap-y-2 text-center text-xs sm:text-sm">
                                                                            {/* Header Row */}
                                                                            <div className="text-left font-bold text-gray-400 pl-2">{t('hole')}</div>
                                                                            {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                                                                                <div key={h} className="font-bold text-gray-400">{h}</div>
                                                                            ))}

                                                                            {/* Par Row */}
                                                                            <div className="text-left font-medium text-gray-500 pl-2">{t('par')}</div>
                                                                            {course?.pars.map((p, i) => (
                                                                                <div key={i} className="text-gray-500">{p}</div>
                                                                            )) || Array(18).fill('-').map((_, i) => <div key={i}>-</div>)}

                                                                            {/* Score Row */}
                                                                            <div className="text-left font-bold text-emerald-400 pl-2">{t('score')}</div>
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

                                                                    {/* Statistics Section */}
                                                                    <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs">
                                                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> {t('stats.birdie')}</div>
                                                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white border border-gray-400"></span> {t('stats.par')}</div>
                                                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> {t('stats.bogey')}</div>
                                                                            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400"></span> {t('stats.double')}</div>
                                                                        </div>

                                                                        <div className="flex justify-center md:justify-end gap-6 text-sm">
                                                                            <div className="bg-gray-700/50 px-3 py-1 rounded">
                                                                                <span className="text-gray-400 mr-2">{t('front9')}:</span>
                                                                                <span className="font-bold text-white">
                                                                                    {Array.from({ length: 9 }, (_, i) => entry.holeScores?.[i + 1] || 0).reduce((a, b) => a + b, 0)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="bg-gray-700/50 px-3 py-1 rounded">
                                                                                <span className="text-gray-400 mr-2">{t('back9')}:</span>
                                                                                <span className="font-bold text-white">
                                                                                    {Array.from({ length: 9 }, (_, i) => entry.holeScores?.[i + 10] || 0).reduce((a, b) => a + b, 0)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
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
