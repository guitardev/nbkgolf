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
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
            <div>
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 9].map((startHole) => (
                    <div key={startHole} className="space-y-2">
                        <h3 className="font-medium text-gray-900">Holes {startHole + 1}-{startHole + 9}</h3>
                        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 text-center">
                            <div>Hole</div>
                            <div>Par</div>
                            <div>Dist</div>
                        </div>
                        {Array.from({ length: 9 }).map((_, i) => {
                            const holeIndex = startHole + i;
                            return (
                                <div key={holeIndex} className="grid grid-cols-3 gap-2 items-center">
                                    <div className="text-center font-medium text-gray-700">{holeIndex + 1}</div>
                                    <input
                                        type="number"
                                        min="3"
                                        max="6"
                                        value={pars[holeIndex]}
                                        onChange={(e) => handleParChange(holeIndex, e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-1 border text-center"
                                    />
                                    <input
                                        type="number"
                                        value={distances[holeIndex]}
                                        onChange={(e) => handleDistanceChange(holeIndex, e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-1 border text-center"
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
                {isSubmitting ? 'Adding Course...' : 'Add Course'}
            </button>
        </form>
    );
}
