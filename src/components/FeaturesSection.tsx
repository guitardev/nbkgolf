'use client';

import { useTranslations } from 'next-intl';
import { Trophy, Smartphone, Calendar, TrendingUp, ShieldCheck, Globe } from 'lucide-react';

export default function FeaturesSection() {
    const t = useTranslations('home.features');

    const features = [
        {
            icon: <Trophy className="w-8 h-8 text-amber-600" />,
            bg: 'bg-amber-100',
            title: t('scoring.title'),
            desc: t('scoring.desc')
        },
        {
            icon: <Smartphone className="w-8 h-8 text-green-600" />,
            bg: 'bg-green-100',
            title: t('login.title'),
            desc: t('login.desc')
        },
        {
            icon: <Calendar className="w-8 h-8 text-blue-600" />,
            bg: 'bg-blue-100',
            title: t('registration.title'),
            desc: t('registration.desc')
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
            bg: 'bg-purple-100',
            title: t('analytics.title'),
            desc: t('analytics.desc')
        },
        {
            icon: <Globe className="w-8 h-8 text-pink-600" />,
            bg: 'bg-pink-100',
            title: t('multilang.title'),
            desc: t('multilang.desc')
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
            bg: 'bg-emerald-100',
            title: t('cloud.title'),
            desc: t('cloud.desc')
        }
    ];

    return (
        <section className="py-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-start gap-4"
                    >
                        <div className={`p-4 rounded-2xl ${feature.bg} group-hover:scale-110 transition-transform duration-300`}>
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-gray-500 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
