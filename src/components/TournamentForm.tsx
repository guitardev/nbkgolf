"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/googleSheets';

export default function TournamentForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [courseId, setCourseId] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/courses')
            .then(res => res.json())
            .then(data => setCourses(data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    date,
                    courseId,
                }),
            });
            router.refresh();
            setName('');
            setDate('');
            setCourseId('');
        } catch (error) {
            console.error('Error adding tournament:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Tournament Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors bg-white text-gray-900"
                    placeholder="Enter tournament name"
                />
            </div>
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Date</label>
                <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border transition-colors bg-white text-gray-900"
                />
            </div>
            <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Course</label>
                <div className="relative">
                    <select
                        required
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base py-3 px-4 border appearance-none transition-colors bg-white pr-10 text-gray-900"
                    >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
            >
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
            </button>
        </form>
    );
}
