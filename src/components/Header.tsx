"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Menu, X, LayoutDashboard, Users, Flag, Trophy, LogOut, TrendingUp, Settings } from "lucide-react";

export default function Header() {
    const pathname = usePathname();
    const t = useTranslations('nav');
    const locale = useLocale();
    const { user, isAdmin, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                                G
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-800">
                                NBK Golf
                            </span>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    const navItems = [
        { href: `/${locale}/dashboard`, label: t('dashboard'), icon: LayoutDashboard, adminOnly: false },
        { href: `/${locale}/leaderboard`, label: t('leaderboard'), icon: TrendingUp, adminOnly: false },
        { href: `/${locale}/my-tournaments`, label: t('myTournaments'), icon: Trophy, adminOnly: false },
        { href: `/${locale}/profile`, label: t('profile'), icon: Users, adminOnly: false },
        { href: `/${locale}/dashboard/players`, label: t('players'), icon: Users, adminOnly: true },
        { href: `/${locale}/dashboard/courses`, label: t('courses'), icon: Flag, adminOnly: true },
        { href: `/${locale}/dashboard/tournaments`, label: t('tournaments'), icon: Trophy, adminOnly: true },
        { href: `/${locale}/dashboard/admin`, label: t('adminSystem'), icon: Settings, adminOnly: true },
    ];

    const isActive = (href: string) => {
        if (href === `/${locale}/dashboard`) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-md' : 'bg-white/50 backdrop-blur-sm'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href={`/${locale}/dashboard`} className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                            G
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-800">
                            NBK Golf
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {user && filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${active
                                        ? "bg-emerald-100/50 text-emerald-700 shadow-sm"
                                        : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <LanguageSwitcher />
                        {user && user.pictureUrl && (
                            <Link href={`/${locale}/profile`} className="relative block group">
                                <img
                                    src={user.pictureUrl}
                                    alt={user.displayName}
                                    className="w-9 h-9 rounded-full border-2 border-transparent group-hover:border-emerald-500 transition-all object-cover shadow-sm"
                                />
                            </Link>
                        )}
                        {user && (
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title={t('logout')}
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <LanguageSwitcher />
                        {user && user.pictureUrl && (
                            <Link href={`/${locale}/profile`} className="relative block">
                                <img
                                    src={user.pictureUrl}
                                    alt={user.displayName}
                                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                                />
                            </Link>
                        )}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {user && filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-3 ${active
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                        {user && (
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                            >
                                <LogOut size={20} />
                                {t('logout')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
