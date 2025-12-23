"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [pars, setPars] = useState<number[]>(Array(18).fill(4));
    const [distances, setDistances] = useState<number[]>(Array(18).fill(350));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleParChange = (index: number, value: string) => {
        const newPars = [...pars];
        newPars[index] = Number(value);
        setPars(newPars);
    };

    const handleDistanceChange = (index: number, value: string) => {
        const newDistances = [...distances];
        newDistances[index] = Number(value);
        setDistances(newDistances);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    pars,
                    distances,
                }),
            });
            router.refresh();
            setName('');
            setPars(Array(18).fill(4));
            setDistances(Array(18).fill(350));
        } catch (error) {
            console.error('Error adding course:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Course Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors"
                    placeholder="Enter course name"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[0, 9].map((startHole) => (
                    <div key={startHole} className="space-y-4">
                        <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Holes {startHole + 1}-{startHole + 9}</h3>
                        <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center mb-2 px-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-8">Hole</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Par</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Dist</div>
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 9 }).map((_, i) => {
                                const holeIndex = startHole + i;
                                return (
                                    <div key={holeIndex} className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm">
                                            {holeIndex + 1}
                                        </div>
                                        <input
                                            type="number"
                                            min="3"
                                            max="6"
                                            value={pars[holeIndex]}
                                            onChange={(e) => handleParChange(holeIndex, e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-2 px-1 border text-center"
                                            placeholder="4"
                                        />
                                        <input
                                            type="number"
                                            value={distances[holeIndex]}
                                            onChange={(e) => handleDistanceChange(holeIndex, e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-2 px-1 border text-center"
                                            placeholder="350"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
            >
                {isSubmitting ? 'Adding Course...' : 'Add Course'}
            </button>
        </form>
    );
}
