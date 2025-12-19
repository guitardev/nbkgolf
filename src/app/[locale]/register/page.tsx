"use client";

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Tournament } from '@/lib/googleSheets';
import Header from '@/components/Header';

export default function RegisterPage() {
    const t = useTranslations('register');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const { user, memberProfile, isLoading: authLoading } = useAuth();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [team, setTeam] = useState('');
    const [formData, setFormData] = useState({
        playerName: '',
        email: '',
        phone: '',
        lineId: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch('/api/tournaments');
                const data: Tournament[] = await res.json();
                // Filter for upcoming or active tournaments
                const available = data.filter(t => t.status === 'upcoming' || t.status === 'active');
                setTournaments(available);
                if (available.length > 0) {
                    setSelectedTournamentId(available[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
                setError("Failed to load tournaments");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    // Pre-fill form if logged in
    useEffect(() => {
        if (memberProfile) {
            setFormData({
                playerName: memberProfile.name || '',
                email: memberProfile.email || '',
                phone: memberProfile.phone || '',
                lineId: memberProfile.lineUserId || ''
            });
            setTeam(memberProfile.team || '');
        }
    }, [memberProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'tournamentId') {
            setSelectedTournamentId(value);
        } else if (name === 'team') {
            setTeam(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!selectedTournamentId) {
            setError("Please select a tournament");
            setIsSubmitting(false);
            return;
        }

        try {
            // If logged in, use TournamentPlayers system
            if (memberProfile) {
                const res = await fetch('/api/tournament-players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournamentId: selectedTournamentId,
                        playerId: memberProfile.id,
                        team: team
                    })
                });

                if (res.status === 409) {
                    setError(t('alreadyRegistered'));
                    setIsSubmitting(false);
                    return;
                }

                if (!res.ok) {
                    throw new Error('Registration failed');
                }

                setSubmitSuccess(true);
                // Redirect to My Tournaments after success
                setTimeout(() => {
                    router.push(`/${locale}/my-tournaments`);
                }, 2000);
            } else {
                // Guest registration - use tournament-players with guest fields
                const res = await fetch('/api/tournament-players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournamentId: selectedTournamentId,
                        guestName: formData.playerName,
                        guestEmail: formData.email,
                        guestPhone: formData.phone
                    })
                });

                if (!res.ok) {
                    throw new Error('Registration failed');
                }

                setSubmitSuccess(true);
                setFormData({
                    playerName: '',
                    email: '',
                    phone: '',
                    lineId: ''
                });
            }
        } catch (err) {
            console.error(err);
            setError(t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">{t('loading')}</div>
            </div>
        );
    }

    return (
        <>
            {user && <Header />}
            <div className={`min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 ${user ? 'pt-24' : ''}`}>
                <div className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                    <div className="px-6 py-8">
                        {/* Title Section */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                {t('title')}
                            </h1>
                            <p className="mt-2 text-gray-400">{t('subtitle')}</p>
                        </div>

                        {submitSuccess ? (
                            // Success View
                            <div className="text-center py-8">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white">{t('success')}</h3>
                                <p className="mt-2 text-gray-400">
                                    {memberProfile ? t('successMessageMember') : t('successMessage')}
                                </p>
                                {!memberProfile && (
                                    <button
                                        onClick={() => setSubmitSuccess(false)}
                                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                                    >
                                        {t('registerAnother')}
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Form View
                            <>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
                                            <span className="block sm:inline">{error}</span>
                                        </div>
                                    )}

                                    {/* Logged in user info */}
                                    {memberProfile && (
                                        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 mb-4">
                                            <p className="text-emerald-300 text-sm">
                                                {t('loggedInAs')}: <strong>{memberProfile.name}</strong>
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="tournamentId" className="block text-sm font-medium text-gray-300">
                                            {t('fields.tournament')}
                                        </label>
                                        <select
                                            id="tournamentId"
                                            name="tournamentId"
                                            required
                                            value={selectedTournamentId}
                                            onChange={handleChange}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-gray-700 text-white"
                                        >
                                            {tournaments.length === 0 ? (
                                                <option value="">{t('noTournaments')}</option>
                                            ) : (
                                                tournaments.map(tournament => (
                                                    <option key={tournament.id} value={tournament.id}>
                                                        {tournament.name} ({tournament.date})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* Team Selection - for logged in users */}
                                    {memberProfile && (
                                        <div>
                                            <label htmlFor="team" className="block text-sm font-medium text-gray-300">
                                                {t('fields.team')}
                                            </label>
                                            <input
                                                type="text"
                                                name="team"
                                                id="team"
                                                value={team}
                                                onChange={handleChange}
                                                placeholder={t('teamPlaceholder')}
                                                className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                            />
                                        </div>
                                    )}

                                    {/* Guest registration fields */}
                                    {!memberProfile && (
                                        <>
                                            <div>
                                                <label htmlFor="playerName" className="block text-sm font-medium text-gray-300">
                                                    {t('fields.name')}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="playerName"
                                                    id="playerName"
                                                    required
                                                    value={formData.playerName}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                                    {t('fields.email')}
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                                    {t('fields.phone')}
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    id="phone"
                                                    required
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="lineId" className="block text-sm font-medium text-gray-300">
                                                    {t('fields.lineId')}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lineId"
                                                    id="lineId"
                                                    value={formData.lineId}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-700 text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || tournaments.length === 0}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                                        >
                                            {isSubmitting ? t('submitting') : t('submit')}
                                        </button>
                                    </div>
                                </form>

                                {/* Check Status Link */}
                                {!memberProfile && (
                                    <div className="mt-6 text-center pt-4 border-t border-gray-700">
                                        <p className="text-gray-400 text-sm mb-2">{tCommon('common.alreadyRegistered') || "Already registered?"}</p>
                                        <a href={`/${locale}/check-status`} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                                            {tCommon('checkStatus.title') || "Check Registration Status"}
                                        </a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
