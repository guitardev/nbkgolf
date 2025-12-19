"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Hash, Users, Save, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, memberProfile, refreshProfile, isLoading: authLoading } = useAuth();
    const t = useTranslations('profile'); // You'll need to add this namespace
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        handicap: 0,
        team: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/${locale}/`);
            return;
        }

        if (memberProfile) {
            setFormData({
                name: memberProfile.name || user?.displayName || '',
                email: memberProfile.email || '',
                phone: memberProfile.phone || '',
                handicap: memberProfile.handicap || 0,
                team: memberProfile.team || ''
            });
        } else if (user) {
            // Pre-fill name from Line profile if no member profile exists
            setFormData(prev => ({ ...prev, name: user.displayName }));
        }
    }, [user, memberProfile, authLoading, locale, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        if (!user) return;

        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lineUserId: user.userId,
                    ...formData
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }

            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // If this was a first-time setup or if explicitly requested, redirect
            setTimeout(() => {
                if (returnUrl) {
                    toast.success(tCommon('success'));
                    router.push(returnUrl);
                } else if (!memberProfile) {
                    // Default fallback for new users without specific return URL
                    toast.success(tCommon('success'));
                    router.push(`/${locale}/dashboard`);
                }
            }, 1500);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>;
    }

    if (!user) return null;

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[url('/golf-bg-pattern.png')] bg-repeat">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-8 text-white">
                            <h1 className="text-3xl font-bold mb-2">
                                {memberProfile ? t('editProfile') : t('completeProfile')}
                            </h1>
                            <p className="text-emerald-100">
                                {memberProfile
                                    ? t('updateInfo')
                                    : t('provideDetails')}
                            </p>
                        </div>

                        <div className="p-8">
                            {message && (
                                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {message.type === 'success' ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">✓</div>
                                    ) : (
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">!</div>
                                    )}
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('fields.name')}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('fields.email')}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">{t('fields.phone')}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                id="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                placeholder="0812345678"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="handicap" className="block text-sm font-medium text-gray-700 mb-1">{t('fields.handicap')}</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Hash className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    name="handicap"
                                                    id="handicap"
                                                    min="0"
                                                    max="36"
                                                    value={formData.handicap}
                                                    onChange={handleChange}
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">{t('fields.team')}</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Users className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="team"
                                                    id="team"
                                                    value={formData.team}
                                                    onChange={handleChange}
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                                    placeholder="Team A"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                {memberProfile ? t('save') : t('createProfile')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
