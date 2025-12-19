"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Calendar, Users, Trophy, Edit2, X, Check } from 'lucide-react';

interface TournamentPlayer {
    id: string;
    tournamentId: string;
    playerId: string;
    team: string;
    registeredAt: string;
    status: string;
}

interface Tournament {
    id: string;
    name: string;
    date: string;
    status: string;
}

export default function MyTournamentsPage() {
    const { user, memberProfile, isLoading: authLoading } = useAuth();
    const t = useTranslations('myTournaments');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [myRegistrations, setMyRegistrations] = useState<TournamentPlayer[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTeam, setEditTeam] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (authLoading) return; // Wait for auth to initialize

        if (!user) {
            router.push(`/${locale}/`);
            return;
        }

        if (memberProfile) {
            fetchData();
        } else {
            // User logged in but no profile -> Redirect to profile creation with return URL
            // Encoded to handle special characters if any, though path is simple here
            const returnUrl = encodeURIComponent(`/${locale}/my-tournaments`);
            router.push(`/${locale}/profile?returnUrl=${returnUrl}`);
        }
    }, [user, memberProfile, authLoading, locale, router]);

    const fetchData = async () => {
        if (!memberProfile) return; // Should be handled by redirect, but safety check

        try {
            const [registrationsRes, tournamentsRes] = await Promise.all([
                fetch(`/api/tournament-players?playerId=${memberProfile.id}`),
                fetch('/api/tournaments')
            ]);

            const registrations = await registrationsRes.json();
            const tournamentsData = await tournamentsRes.json();

            setMyRegistrations(Array.isArray(registrations) ? registrations : []);
            setTournaments(tournamentsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTournamentInfo = (tournamentId: string) => {
        return tournaments.find(t => t.id === tournamentId);
    };

    const handleEditTeam = (registration: TournamentPlayer) => {
        setEditingId(registration.id);
        setEditTeam(registration.team);
    };

    const handleSaveTeam = async (id: string) => {
        try {
            const res = await fetch(`/api/tournament-players?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: editTeam })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: t('teamUpdated') });
                setEditingId(null);
                fetchData();
            } else {
                setMessage({ type: 'error', text: t('updateFailed') });
            }
        } catch (error) {
            setMessage({ type: 'error', text: t('updateFailed') });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleWithdraw = async (id: string) => {
        if (!confirm(t('confirmWithdraw'))) return;

        try {
            const res = await fetch(`/api/tournament-players?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setMessage({ type: 'success', text: t('withdrawSuccess') });
                fetchData();
            } else {
                setMessage({ type: 'error', text: t('withdrawFailed') });
            }
        } catch (error) {
            setMessage({ type: 'error', text: t('withdrawFailed') });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
                        <p className="mt-2 text-gray-600">{t('subtitle')}</p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    {!memberProfile ? (
                        // Loading state while redirecting
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : myRegistrations.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <Trophy className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noTournaments')}</h3>
                            <p className="text-gray-500 mb-6">{t('noTournamentsDesc')}</p>
                            <button
                                onClick={() => router.push(`/${locale}/register`)}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                {t('registerNow')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myRegistrations.map((registration) => {
                                const tournament = getTournamentInfo(registration.tournamentId);
                                const isEditing = editingId === registration.id;

                                return (
                                    <div key={registration.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {tournament?.name || 'Unknown Tournament'}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {tournament?.date || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editTeam}
                                                                onChange={(e) => setEditTeam(e.target.value)}
                                                                className="border rounded px-2 py-1 text-sm w-32"
                                                                placeholder={t('enterTeam')}
                                                            />
                                                        ) : (
                                                            <span>{registration.team || t('noTeam')}</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        registration.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {registration.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveTeam(registration.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title={tCommon('save')}
                                                        >
                                                            <Check className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title={tCommon('cancel')}
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditTeam(registration)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('changeTeam')}
                                                        >
                                                            <Edit2 className="h-5 w-5" />
                                                        </button>
                                                        {registration.status !== 'withdrawn' && (
                                                            <button
                                                                onClick={() => handleWithdraw(registration.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title={t('withdraw')}
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
