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
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tournament Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <select
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border"
                >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                </select>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
            </button>
        </form>
    );
}
