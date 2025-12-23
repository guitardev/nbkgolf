"use client";

import { useTranslations } from 'next-intl';
import { Minus, Plus, Circle } from 'lucide-react';

interface HoleInputProps {
    par: number;
    score: number | undefined;
    onChange: (score: number) => void;
}

export default function HoleInput({ par, score, onChange }: HoleInputProps) {
    const t = useTranslations('scoring');
    const currentScore = score || par; // Default to par if no score

    const handleIncrement = () => onChange(currentScore + 1);
    const handleDecrement = () => onChange(Math.max(1, currentScore - 1));

    const getScoreColor = (s: number, p: number) => {
        const diff = s - p;
        if (diff <= -2) return 'text-yellow-500'; // Eagle or better
        if (diff === -1) return 'text-red-500'; // Birdie
        if (diff === 0) return 'text-gray-800'; // Par
        if (diff === 1) return 'text-blue-500'; // Bogey
        if (diff >= 2) return 'text-black'; // Double Bogey or worse
        return 'text-gray-800';
    };

    const getScoreLabel = (s: number, p: number) => {
        const diff = s - p;
        if (s === 1) return t('terms.holeInOne');
        if (diff <= -3) return t('terms.albatross');
        if (diff === -2) return t('terms.eagle');
        if (diff === -1) return t('terms.birdie');
        if (diff === 0) return t('terms.par');
        if (diff === 1) return t('terms.bogey');
        if (diff === 2) return t('terms.doubleBogey');
        if (diff === 3) return t('terms.tripleBogey');
        return `${diff > 0 ? '+' : ''}${diff}`;
    };

    return (
        <div className="flex flex-col items-center space-y-6 py-4">
            <div className="text-center space-y-1">
                <span className={`text-xl font-medium ${getScoreColor(currentScore, par)}`}>
                    {score ? getScoreLabel(currentScore, par) : t('enterScore')}
                </span>
            </div>

            <div className="flex items-center space-x-8">
                <button
                    onClick={handleDecrement}
                    className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-emerald-500 active:scale-95 transition-all shadow-sm"
                    type="button"
                >
                    <Minus size={32} />
                </button>

                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-emerald-100 flex items-center justify-center shadow-inner">
                    <span className="text-5xl font-bold text-gray-900">
                        {score || '-'}
                    </span>
                </div>

                <button
                    onClick={handleIncrement}
                    className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-emerald-500 active:scale-95 transition-all shadow-sm"
                    type="button"
                >
                    <Plus size={32} />
                </button>
            </div>

            <div className="flex gap-3">
                {[par - 1, par, par + 1].map((quickScore) => (
                    <button
                        key={quickScore}
                        onClick={() => onChange(quickScore)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${score === quickScore
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {quickScore}
                    </button>
                ))}
            </div>
        </div>
    );
}
