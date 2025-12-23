"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import { Loader2, ChevronLeft, ChevronRight, Save, MapPin } from 'lucide-react';
import { Course, Tournament } from '@/lib/googleSheets';
import HoleInput from '@/components/scoring/HoleInput';
import DigitalScorecard from '@/components/scoring/DigitalScorecard';
import toast from 'react-hot-toast';

export default function MobileScoringPage() {
    const { user, memberProfile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations('play');

    const [loading, setLoading] = useState(true);
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [currentHole, setCurrentHole] = useState<number>(1);
    const [scores, setScores] = useState<{ [hole: number]: number }>({});
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'hole' | 'card'>('hole');

    useEffect(() => {
        async function loadData() {
            if (authLoading) return;
            if (!user) {
                router.push('/');
                return;
            }

            try {
                // 1. Get Active Tournament
                // TODO: Create a specialized API for this or filter client side optimally
                const tRes = await fetch('/api/tournaments');
                const tournaments: Tournament[] = await tRes.json();
                const active = tournaments.find(t => t.status === 'active' || t.status === 'upcoming'); // Allowing upcoming for testing

                if (!active) {
                    toast.error(t('toasts.noActiveFound'));
                    setLoading(false);
                    return;
                }
                setActiveTournament(active);

                // 2. Get Course Details
                if (active.courseId) {
                    const cRes = await fetch('/api/courses');
                    const courses: Course[] = await cRes.json();
                    const currentCourse = courses.find(c => c.id === active.courseId);
                    setCourse(currentCourse || null);
                }

                // 3. Get Existing Scores for User
                if (memberProfile?.id) {
                    const sRes = await fetch(`/api/scores?tournamentId=${active.id}`);
                    const allScores = await sRes.json();
                    const myScores = allScores.filter((s: any) => s.playerId === memberProfile.id);

                    const scoreMap: { [key: number]: number } = {};
                    myScores.forEach((s: any) => {
                        scoreMap[s.hole] = s.strokes;
                    });
                    setScores(scoreMap);
                }

            } catch (error) {
                console.error("Failed to load scoring data", error);
                toast.error(t('toasts.loadError'));
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user, authLoading, memberProfile, router]);


    const handleScoreChange = async (score: number) => {
        // Optimistic update
        setScores(prev => ({ ...prev, [currentHole]: score }));

        // Debounced save could be better, but for now specific save or auto-save on navigation
    };

    const saveScore = async (hole: number, score: number) => {
        if (!activeTournament || !memberProfile) return;

        setSaving(true);
        try {
            // We'll update just this hole, specifically.
            // But our API supports upsert, so we can send the whole map or just one.
            // Sending just one is more efficient if API supports it, but currently API expects full Batch 'scores' map for upsert.
            // Let's send the updated map.

            const updatedScores = { ...scores, [hole]: score };

            await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: activeTournament.id,
                    playerId: memberProfile.id,
                    scores: updatedScores
                })
            });
            // toast.success('Saved', { duration: 1000 });
        } catch (error) {
            console.error('Save failed', error);
            toast.error(t('toasts.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const navigateHole = (direction: 'next' | 'prev') => {
        // Save current hole before moving?
        if (scores[currentHole]) {
            saveScore(currentHole, scores[currentHole]);
        }

        if (direction === 'next') {
            setCurrentHole(prev => Math.min(18, prev + 1));
        } else {
            setCurrentHole(prev => Math.max(1, prev - 1));
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emerald-600 w-8 h-8" />
            </div>
        );
    }

    if (!activeTournament || !course) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <Header />
                <div className="text-center mt-20">
                    <h2 className="text-xl font-bold text-gray-900">{t('noActiveTournament')}</h2>
                    <p className="text-gray-500 mt-2">{t('noActiveTournamentDesc')}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="mt-6 text-emerald-600 font-medium hover:underline"
                    >
                        {t('returnToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    const currentPar = course.pars[currentHole - 1] || 4;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />

            <main className="pt-20 px-4 max-w-md mx-auto">
                {/* Course Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{activeTournament.name}</h1>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                            <MapPin size={14} className="mr-1" />
                            {course.name}
                        </div>
                    </div>
                    <button
                        onClick={() => setViewMode(viewMode === 'hole' ? 'card' : 'hole')}
                        className="text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                        {viewMode === 'hole' ? t('viewCard') : t('enterScore')}
                    </button>
                </div>

                {viewMode === 'card' ? (
                    <DigitalScorecard
                        scores={scores}
                        pars={course.pars}
                        currentHole={currentHole}
                        onHoleSelect={(h) => {
                            setCurrentHole(h);
                            setViewMode('hole');
                        }}
                    />
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
                        {saving && (
                            <div className="absolute top-2 right-2">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                            </div>
                        )}

                        {/* Hole Info Header */}
                        <div className="bg-gray-900 text-white p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
                            <h2 className="text-4xl font-black mb-1">{t('hole')} {currentHole}</h2>
                            <div className="flex justify-center gap-4 text-gray-400 text-sm font-medium tracking-widest uppercase">
                                <span>{t('par')} {currentPar}</span>
                                {course.distances && <span>{course.distances[currentHole - 1]} {t('yards')}</span>}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-6">
                            <HoleInput
                                par={currentPar}
                                score={scores[currentHole]}
                                onChange={handleScoreChange}
                            />
                        </div>

                        {/* Navigation Footer */}
                        <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-100">
                            <button
                                onClick={() => navigateHole('prev')}
                                disabled={currentHole === 1}
                                className="flex items-center text-gray-600 hover:text-emerald-600 disabled:opacity-30 font-medium transition-colors"
                            >
                                <ChevronLeft className="mr-1" /> {t('prev')}
                            </button>

                            <div className="flex gap-1 h-1.5">
                                {Array.from({ length: 18 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 rounded-full ${i + 1 === currentHole ? 'bg-emerald-500 w-3' : (scores[i + 1] ? 'bg-emerald-200' : 'bg-gray-200')}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => navigateHole('next')}
                                disabled={currentHole === 18}
                                className="flex items-center text-gray-600 hover:text-emerald-600 disabled:opacity-30 font-medium transition-colors"
                            >
                                {t('next')} <ChevronRight className="ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
