"use client";

import { useTranslations } from 'next-intl';

interface DigitalScorecardProps {
    scores: { [hole: number]: number };
    pars: number[]; // 1-indexed (index 0 is unused or careful mapping needed)
    currentHole: number;
    onHoleSelect: (hole: number) => void;
}

export default function DigitalScorecard({ scores, pars, currentHole, onHoleSelect }: DigitalScorecardProps) {
    // Note: pars input array is usually 0-indexed for hole 1..18, so pars[0] is Hole 1

    const frontNine = Array.from({ length: 9 }, (_, i) => i + 1);
    const backNine = Array.from({ length: 9 }, (_, i) => i + 10);

    const renderHoleRef = (hole: number) => {
        const score = scores[hole];
        const par = pars[hole - 1] || 4; // Default par 4 if missing

        // Visual styles for score vs par
        let bgClass = "bg-white";
        let textClass = "text-gray-700";
        let borderClass = "border-gray-100";

        if (score) {
            const diff = score - par;
            if (diff < 0) { // Birdie or better
                bgClass = "bg-red-50";
                textClass = "text-red-700";
                borderClass = "border-red-200";
            } else if (diff === 0) { // Par
                bgClass = "bg-gray-50";
                textClass = "text-gray-900";
                borderClass = "border-gray-200";
            } else if (diff > 0) { // Bogey or worse
                bgClass = "bg-blue-50";
                textClass = "text-blue-700";
                borderClass = "border-blue-200";
            }
        }

        const isSelected = currentHole === hole;
        if (isSelected) {
            borderClass = "border-emerald-500 ring-2 ring-emerald-500 ring-offset-1";
        }

        return (
            <button
                key={hole}
                onClick={() => onHoleSelect(hole)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border ${bgClass} ${borderClass} transition-all shadow-sm`}
            >
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">H{hole}</span>
                <span className={`text-xl font-bold ${textClass}`}>{score || '-'}</span>
                <span className="text-[10px] text-gray-400">Par {par}</span>
            </button>
        );
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const totalPar = pars.reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Total Score</p>
                        <p className="text-3xl font-bold text-gray-900">{totalScore > 0 ? totalScore : '-'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Total Par</p>
                        <p className="text-sm font-medium text-gray-600">{totalPar}</p>
                    </div>
                </div>

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Front Nine</h4>
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {frontNine.map(renderHoleRef)}
                </div>

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Back Nine</h4>
                <div className="grid grid-cols-5 gap-2">
                    {backNine.map(renderHoleRef)}
                </div>
            </div>
        </div>
    );
}
