"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '../i18n';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = (newLocale: string) => {
        // Remove current locale from pathname and add new locale
        const pathWithoutLocale = pathname.replace(`/${locale}`, '');
        const newPath = `/${newLocale}${pathWithoutLocale}`;
        router.push(newPath);
    };

    return (
        <div className="flex items-center gap-2">
            {locales.map((loc) => (
                <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${locale === loc
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {loc.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
