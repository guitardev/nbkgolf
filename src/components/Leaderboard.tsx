"use client";

import { useState, useEffect } from 'react';
import { Player, Score, Tournament, Course } from '@/lib/googleSheets';
import { generateLeaderboard, LeaderboardEntry, ScoringSystem, getScoringSystemName } from '@/lib/scoringCalculator';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslations, useLocale } from 'next-intl';

interface LeaderboardProps {
    tournamentId: string;
}

export default function Leaderboard({ tournamentId }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [scoringSystem, setScoringSystem] = useState<ScoringSystem>('stroke');
    const t = useTranslations('leaderboard');
    const locale = useLocale();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Tournament to get scoring system and courseId
                const tournamentsRes = await fetch('/api/tournaments');
                const tournaments: Tournament[] = await tournamentsRes.json();
                const tournament = tournaments.find(t => t.id === tournamentId);

                if (!tournament) return;

                setScoringSystem(tournament.scoringSystem || 'stroke');

                // 2. Fetch Course to get pars
                const coursesRes = await fetch('/api/courses');
                const courses: Course[] = await coursesRes.json();
                const course = courses.find(c => c.id === tournament.courseId);

                // 3. Fetch Players and Scores
                const [playersRes, scoresRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch(`/api/scores?tournamentId=${tournamentId}`)
                ]);

                const players: Player[] = await playersRes.json();
                const scores: Score[] = await scoresRes.json();

                // 4. Generate Leaderboard
                // Default pars if course not found
                const pars = course?.pars || Array(18).fill(4);

                const calculatedEntries = generateLeaderboard(players, scores, pars, tournament.scoringSystem || 'stroke');
                setEntries(calculatedEntries);
            } catch (error) {
                console.error("Failed to fetch leaderboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Live update every 30s
        return () => clearInterval(interval);
    }, [tournamentId]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(entries.map(e => ({
            Position: e.rank,
            Player: e.player.name,
            Gross: e.grossScore,
            Handicap: e.handicap,
            Net: e.netScore,
            Points: e.points,
            ...((scoringSystem === 'stableford') ? { Score: e.points } : { Score: e.netScore })
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `tournament_results_${tournamentId}.xlsx`);
    };

    if (loading) {
        return <div className="p-4 text-center">{t('loading')}</div>;
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{t('title')}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {getScoringSystemName(scoringSystem, locale)}
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                    Export Excel
                </button>
            </div>
            <div className="border-t border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pos')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('player')}</th>

                            {/* Dynamic Columns based on System */}
                            {scoringSystem === 'stableford' ? (
                                <>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('points')}</th>
                                </>
                            ) : (
                                <>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('gross')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('hcp')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('net')}</th>
                                </>
                            )}

                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('thru')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry) => (
                            <tr key={entry.player.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.rank === 0 ? '-' : entry.rank}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {entry.player.name}
                                </td>

                                {scoringSystem === 'stableford' ? (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                        {entry.points}
                                    </td>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {entry.grossScore > 0 ? entry.grossScore : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {entry.handicap}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {entry.netScore > 0 ? entry.netScore : '-'}
                                        </td>
                                    </>
                                )}

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    18 {/* Fixed for now as we don't track per-hole progress dynamically yet, or rely on scores count */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
