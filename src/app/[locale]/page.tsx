"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import NewsSection from "@/components/NewsSection";
import FeaturesSection from "@/components/FeaturesSection";
import MiniLeaderboard from "@/components/MiniLeaderboard";

export default function Home() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('home');

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white selection:bg-emerald-100 selection:text-emerald-900">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-gradient-to-tr from-yellow-100/40 to-lime-100/40 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl w-full space-y-16 text-center">


          {/* Logo & Title */}
          <div className="space-y-6">
            <div className="mx-auto w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-100 transform rotate-3 hover:rotate-0 transition-all duration-500 border border-emerald-50 group">
              <img src="/logo.png" alt="NBK Golf" className="w-20 h-20 object-contain rounded-xl group-hover:scale-110 transition-transform" />
            </div>

            <div className="space-y-2">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-gray-900 drop-shadow-sm">
                NBK <span className="text-emerald-600 relative inline-block">
                  Golf
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="text-gray-500 text-xl sm:text-2xl font-medium tracking-wide max-w-2xl mx-auto">
                Premium Tournament System
              </p>
            </div>
          </div>

          <MiniLeaderboard />

          {/* Login Button */}
          <div className="space-y-6 pt-8">
            <button
              onClick={login}
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-[280px] py-4 px-8 bg-gradient-to-r from-[#06C755] to-[#00B900] text-white font-bold rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform transition-all hover:scale-105 active:scale-95 duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current relative z-10">
                <path d="M20.4 10c0-5.5-4.5-10-10-10S.4 4.5.4 10c0 4.9 3.6 9 8.2 9.9v-7H6.3v-2.9h2.3V7.5c0-2.3 1.4-3.5 3.4-3.5.9 0 1.9.2 1.9.2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4v1.7h2.5l-.4 2.9h-2.1v7c4.6-.9 8.2-5 8.2-9.9z" />
              </svg>
              <span className="text-xl relative z-10">{t('loginOrRegister')}</span>
            </button>
            <p className="text-sm text-gray-400 font-medium">
              Secure access via LINE Login
            </p>
          </div>



          {/* Features Grid */}
          <FeaturesSection />

          <NewsSection />


        </div>
      </div>
    </main>
  );
}
