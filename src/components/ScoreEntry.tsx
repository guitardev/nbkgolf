"use client";

import { useState, useEffect } from 'react';
import { Player, Course } from '@/lib/googleSheets';

interface ScoreEntryProps {
    tournamentId: string;
    course: Course;
}

export default function ScoreEntry({ tournamentId, course }: ScoreEntryProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [scores, setScores] = useState<{ [hole: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => setPlayers(data));
    }, []);

    const handleScoreChange = (hole: number, value: string) => {
        setScores(prev => ({
            ...prev,
            [hole]: Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlayerId) return;
        setIsSubmitting(true);

        try {
            // Submit scores as a single batch to prevent race conditions
            // and reduce API calls from 18 to 1.
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    playerId: selectedPlayerId,
                    scores: scores // { 1: 4, 2: 5, ... }
                }),
            });

            if (response.ok) {
                alert('Scores submitted successfully!');
                setScores({});
                setSelectedPlayerId('');
            } else {
                alert('Failed to submit scores. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting scores:', error);
            alert('An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enter Scores</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Player</label>
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white text-gray-900"
                    >
                        <option value="">Select Player</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {selectedPlayerId && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {course.pars.map((par, index) => {
                            const hole = index + 1;
                            return (
                                <div key={hole} className="text-center border p-2 rounded">
                                    <div className="text-xs text-gray-500">Hole {hole}</div>
                                    <div className="text-xs font-bold mb-1">Par {par}</div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={scores[hole] || ''}
                                        onChange={(e) => handleScoreChange(hole, e.target.value)}
                                        className="w-full text-center border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white text-gray-900"
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !selectedPlayerId}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Scores'}
                </button>
            </form>
        </div>
    );
}
