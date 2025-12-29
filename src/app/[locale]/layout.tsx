import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import '../globals.css';
import { AuthProvider } from "@/contexts/AuthContext";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { LiffProvider } from "@/contexts/LiffContext";
import Header from "@/components/Header";
import { Toaster } from 'react-hot-toast'; // Import Toaster
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "NBK Golf Tournament",
    description: "Premium Golf Tournament Recording System",
};

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Get locale from params (Next.js 14 pattern)
    const { locale } = params;


    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthSessionProvider>
                    <AuthProvider>
                        <NextIntlClientProvider messages={messages} locale={locale}>
                            <LiffProvider>
                                <Toaster position="top-center" />
                                <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
                                    <Header />
                                    {/* Main Content */}
                                    <main className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                                        {children}
                                    </main>
                                </div>
                            </LiffProvider>
                        </NextIntlClientProvider>
                    </AuthProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
