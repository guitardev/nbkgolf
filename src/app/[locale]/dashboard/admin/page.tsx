
"use client";

import { useTranslations } from 'next-intl';
import AdminGuard from '@/components/AdminGuard'; // Check path is correct
import SystemTools from '@/components/admin/SystemTools';

export default function AdminPage() {
    const t = useTranslations('adminTools');

    return (
        <AdminGuard>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            {t('title')}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {t('subtitle')}
                        </p>
                    </div>
                </div>

                <SystemTools />

            </div>
        </AdminGuard>
    );
}
