"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayerForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        handicap: '',
        team: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    handicap: Number(formData.handicap),
                    team: formData.team,
                }),
            });
            router.refresh();
            setFormData({ name: '', handicap: '', team: '' });
        } catch (error) {
            console.error('Error adding player:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors bg-white text-gray-900"
                    placeholder="Enter player name"
                />
            </div>
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Handicap</label>
                <input
                    type="number"
                    required
                    value={formData.handicap}
                    onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors bg-white text-gray-900"
                    placeholder="Enter handicap"
                />
            </div>
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Team</label>
                <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors bg-white text-gray-900"
                    placeholder="Enter team name (optional)"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
            >
                {isSubmitting ? 'Adding...' : 'Add Player'}
            </button>
        </form>
    );
}
