"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Player, Course, Tournament, TournamentPlayer } from "@/lib/googleSheets";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Users, Flag, Trophy, UserPlus, ArrowRight, Activity, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
    const { user, memberProfile, isAdmin, isLoading: authLoading } = useAuth();
    const t = useTranslations('dashboard');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    const [stats, setStats] = useState({
        players: 0,
        courses: 0,
        tournaments: 0,
        registrations: 0,
    });
    const [recentRegistrations, setRecentRegistrations] = useState<TournamentPlayer[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push(`/${locale}/`);
                return;
            }

            // Redirect to profile setup if no member profile OR phone is missing
            // (Auto-registration creates profile, but phone is mandatory)
            if (!memberProfile || !memberProfile.phone) {
                toast.error(t('profileRequiredRedirect'));
                router.push(`/${locale}/profile`);
                return;
            }
        }

        if (isAdmin) {
            const fetchData = async () => {
                try {
                    const [playersRes, coursesRes, tournamentsRes, registrationsRes] = await Promise.all([
                        fetch('/api/players'),
                        fetch('/api/courses'),
                        fetch('/api/tournaments'),
                        fetch('/api/tournament-players')
                    ]);

                    const players: Player[] = await playersRes.json();
                    const courses: Course[] = await coursesRes.json();
                    const tournaments: Tournament[] = await tournamentsRes.json();
                    const registrations: TournamentPlayer[] = await registrationsRes.json();

                    setAllPlayers(players);
                    setStats({
                        players: players.length,
                        courses: courses.length,
                        tournaments: tournaments.length,
                        registrations: registrations.filter(r => r.status === 'pending').length,
                    });

                    setRecentRegistrations(registrations.slice(-5).reverse());
                } catch (error) {
                    console.error("Failed to fetch dashboard data", error);
                } finally {
                    setDataLoading(false);
                }
            };

            fetchData();
        } else {
            setDataLoading(false);
        }
    }, [user, memberProfile, isAdmin, authLoading, locale, router]);

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>;
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-[url('/golf-bg-pattern.png')] bg-repeat">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="mb-10 bg-gradient-to-r from-emerald-800 to-green-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>

                    <h1 className="text-4xl font-bold mb-2 relative z-10">
                        {t('welcome', { name: memberProfile?.name || user.displayName || 'Golfer' })}
                    </h1>
                    <p className="text-emerald-100 text-lg relative z-10">
                        {isAdmin ? "Manage your tournaments, players, and courses with ease." : t('welcomeGuest')}
                    </p>
                </div>

                {isAdmin && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                        <Users className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Total</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    {dataLoading ? "..." : stats.players}
                                </div>
                                <div className="text-sm text-gray-500">{t('stats.totalPlayers')}</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <Flag className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    {dataLoading ? "..." : stats.courses}
                                </div>
                                <div className="text-sm text-gray-500">{t('stats.activeCourses')}</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                        <Trophy className="w-8 h-8 text-purple-600" />
                                    </div>
                                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Events</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    {dataLoading ? "..." : stats.tournaments}
                                </div>
                                <div className="text-sm text-gray-500">{t('stats.tournaments')}</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                                        <UserPlus className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    {dataLoading ? "..." : stats.registrations}
                                </div>
                                <div className="text-sm text-gray-500">{t('stats.pendingRegistrations')}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Recent Activity */}
                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-gray-400" />
                                        {t('recentRegistrations')}
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {dataLoading ? (
                                        <div className="p-8 text-center text-gray-500">{tCommon('loading')}</div>
                                    ) : recentRegistrations.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                                            <Calendar className="w-10 h-10 text-gray-300" />
                                            {t('noRecentRegistrations')}
                                        </div>
                                    ) : (
                                        recentRegistrations.map((reg) => {
                                            const player = reg.playerId ? allPlayers.find(p => p.id === reg.playerId) : null;
                                            const displayName = player ? player.name : reg.guestName || 'Unknown Guest';
                                            const displayEmail = player ? player.email : reg.guestEmail || 'No email';

                                            return (
                                                <div key={reg.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                            {displayName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{displayName}</p>
                                                            <p className="text-sm text-gray-500">{displayEmail}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${reg.status === 'confirmed' || reg.status === 'registered'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : reg.status === 'withdrawn'
                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                                                        }`}>
                                                        {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                    {t('quickActions')}
                                </h2>
                                <div className="space-y-4">
                                    <Link
                                        href={`/${locale}/dashboard/players`}
                                        className="group w-full p-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 text-emerald-700 rounded-xl hover:shadow-md transition-all flex items-center justify-between"
                                    >
                                        <span className="font-medium flex items-center gap-3">
                                            <Users className="w-5 h-5" />
                                            {t('addNewPlayer')}
                                        </span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </Link>
                                    <Link
                                        href={`/${locale}/dashboard/tournaments`}
                                        className="group w-full p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 text-blue-700 rounded-xl hover:shadow-md transition-all flex items-center justify-between"
                                    >
                                        <span className="font-medium flex items-center gap-3">
                                            <Trophy className="w-5 h-5" />
                                            {t('createTournament')}
                                        </span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </Link>
                                    <Link
                                        href={`/${locale}/dashboard/courses`}
                                        className="group w-full p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 text-purple-700 rounded-xl hover:shadow-md transition-all flex items-center justify-between"
                                    >
                                        <span className="font-medium flex items-center gap-3">
                                            <Flag className="w-5 h-5" />
                                            {t('manageCourses')}
                                        </span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </Link>
                                    <Link
                                        href={`/${locale}/dashboard/registrations`}
                                        className="group w-full p-4 bg-gradient-to-r from-orange-50 to-white border border-orange-100 text-orange-700 rounded-xl hover:shadow-md transition-all flex items-center justify-between"
                                    >
                                        <span className="font-medium flex items-center gap-3">
                                            <Activity className="w-5 h-5" />
                                            {t('registrations.title')}
                                        </span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!isAdmin && (
                    <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('welcomeGuest')}</h2>
                        <p className="text-gray-600 mb-8 text-lg">{t('participantMessage')}</p>
                        <Link
                            href={`/${locale}/register`}
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            {t('registerForTournament')}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
