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
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Handicap</label>
                <input
                    type="number"
                    required
                    value={formData.handicap}
                    onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Team</label>
                <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
                {isSubmitting ? 'Adding...' : 'Add Player'}
            </button>
        </form>
    );
}
