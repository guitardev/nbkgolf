"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Search, ArrowLeft, Calendar, User, Trophy } from 'lucide-react';

interface RegistrationResult {
    id: string;
    tournamentId: string;
    tournamentName: string;
    tournamentDate: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    status: string;
    team: string;
}

export default function CheckStatusPage() {
    const t = useTranslations('checkStatus');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [results, setResults] = useState<RegistrationResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email && !phone) {
            setError(t('validationError'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);
        setHasSearched(false);

        try {
            const res = await fetch('/api/guest-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone })
            });

            if (!res.ok) {
                throw new Error('Search failed');
            }

            const data = await res.json();
            setResults(data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
            setError(t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="w-full max-w-md">
                <Link href="/register" className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t('backToRegister')}
                </Link>

                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
                    <p className="text-gray-400">{t('subtitle')}</p>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 p-6 md:p-8">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                {t('email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-4 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="guest@example.com"
                            />
                        </div>

                        <div className="relative flex items-center justify-center">
                            <span className="bg-gray-800 px-3 text-gray-400 text-sm absolute z-10">{t('or')}</span>
                            <div className="w-full border-t border-gray-700 absolute"></div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                {t('phone')}
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-4 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="0812345678"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Search className="w-5 h-5 mr-2" />
                            )}
                            {isLoading ? t('searching') : t('search')}
                        </button>
                    </form>
                </div>
            </div>

            {hasSearched && results && (
                <div className="w-full max-w-2xl mt-12 animate-fade-in">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">
                        {t('resultsTitle', { count: results.length })}
                    </h2>

                    {results.length === 0 ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                            <p className="text-gray-400">{t('noResults')}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {results.map((reg) => (
                                <div key={reg.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-400 mb-1 flex items-center">
                                                <Trophy className="w-4 h-4 mr-2" />
                                                {reg.tournamentName}
                                            </h3>
                                            <div className="text-gray-400 text-sm flex items-center mb-3">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {reg.tournamentDate}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <User className="w-4 h-4 mr-2" />
                                                {reg.guestName}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start md:items-end justify-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${reg.status === 'confirmed' || reg.status === 'registered' ? 'bg-green-900/50 text-green-400 border border-green-700' :
                                                    reg.status === 'withdrawn' ? 'bg-red-900/50 text-red-400 border border-red-700' :
                                                        'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                                                }`}>
                                                {reg.status}
                                            </span>
                                            {reg.team && (
                                                <span className="text-sm text-gray-400">Team: <span className="text-white">{reg.team}</span></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
