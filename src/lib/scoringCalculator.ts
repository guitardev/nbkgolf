import { Score, Player } from './googleSheets';

// Scoring system types
export type ScoringSystem = 'stroke' | 'stableford' | '36system' | 'callaway';

// Stableford point table
const STABLEFORD_POINTS: Map<number, number> = new Map([
    [-3, 5], // Albatross
    [-2, 4], // Eagle
    [-1, 3], // Birdie
    [0, 2],  // Par
    [1, 1],  // Bogey
    [2, 0],  // Double Bogey
    [3, 0],  // Triple Bogey+
]);

function getStablefordPoints(diff: number): number {
    return STABLEFORD_POINTS.get(diff) ?? 0;
}

// Callaway table: [minScore, maxScore, holesDeduct, adjustment]
const CALLAWAY_TABLE = [
    { min: 0, max: 75, holes: 0, adjustment: 0 },
    { min: 76, max: 80, holes: 1, adjustment: 0 },
    { min: 81, max: 85, holes: 2, adjustment: 0 },
    { min: 86, max: 90, holes: 3, adjustment: 1 },
    { min: 91, max: 95, holes: 4, adjustment: 1 },
    { min: 96, max: 100, holes: 5, adjustment: 2 },
    { min: 101, max: 105, holes: 6, adjustment: 2 },
    { min: 106, max: 999, holes: 7, adjustment: 3 },
];

/**
 * Calculate Gross Score (Stroke Play)
 */
export function calculateStrokePlay(scores: Score[]): number {
    return scores
        .filter(s => s.hole > 0 && s.hole <= 18)
        .reduce((sum, s) => sum + s.strokes, 0);
}

/**
 * Calculate Stableford Points
 */
export function calculateStableford(scores: Score[], pars: number[]): number {
    let totalPoints = 0;

    for (let hole = 1; hole <= 18; hole++) {
        const score = scores.find(s => s.hole === hole);
        const par = pars[hole - 1] || 4;

        if (score && score.strokes > 0) {
            const diff = score.strokes - par;
            // Cap at +2 (double bogey or worse = 0 points)
            const cappedDiff = Math.min(Math.max(diff, -3), 2);
            const points = getStablefordPoints(cappedDiff);
            totalPoints += points;
        }
    }

    return totalPoints;
}

/**
 * Calculate Handicap using 36 System
 * Formula: Handicap = (Gross Score - 36) × 0.8
 */
export function calculate36System(grossScore: number): { handicap: number; net: number } {
    const handicap = Math.round((grossScore - 36) * 0.8);
    const net = grossScore - Math.max(handicap, 0);
    return { handicap: Math.max(handicap, 0), net };
}

/**
 * Calculate Callaway System Handicap
 * - Deduct worst holes based on gross score (excluding holes 17, 18)
 * - Apply adjustment from table
 */
export function calculateCallaway(scores: Score[], pars: number[]): { handicap: number; net: number; grossScore: number } {
    const grossScore = calculateStrokePlay(scores);

    // Find Callaway table entry
    const tableEntry = CALLAWAY_TABLE.find(
        entry => grossScore >= entry.min && grossScore <= entry.max
    ) || CALLAWAY_TABLE[CALLAWAY_TABLE.length - 1];

    // Get hole scores for holes 1-16 only (exclude 17, 18)
    const holeScores: { hole: number; strokes: number; par: number }[] = [];
    for (let hole = 1; hole <= 16; hole++) {
        const score = scores.find(s => s.hole === hole);
        const par = pars[hole - 1] || 4;
        if (score && score.strokes > 0) {
            // Cap at double par for deduction
            const cappedStrokes = Math.min(score.strokes, par * 2);
            holeScores.push({ hole, strokes: cappedStrokes, par });
        }
    }

    // Sort by strokes (worst first)
    holeScores.sort((a, b) => b.strokes - a.strokes);

    // Get worst holes to deduct
    const holesToDeduct = tableEntry.holes;
    let deduction = 0;

    for (let i = 0; i < Math.floor(holesToDeduct); i++) {
        if (holeScores[i]) {
            deduction += holeScores[i].strokes;
        }
    }

    // Handle half hole (if decimal)
    const halfHole = holesToDeduct % 1;
    if (halfHole > 0 && holeScores[Math.floor(holesToDeduct)]) {
        deduction += Math.floor(holeScores[Math.floor(holesToDeduct)].strokes / 2);
    }

    // Apply adjustment
    const handicap = Math.max(0, deduction - tableEntry.adjustment);
    const net = grossScore - handicap;

    return { handicap, net, grossScore };
}

/**
 * Result type for leaderboard
 */
export interface LeaderboardEntry {
    player: Player;
    grossScore: number;
    netScore: number;
    handicap: number;
    points: number; // For Stableford
    rank: number;
    thru: number;
}

/**
 * Generate leaderboard based on scoring system
 */
export function generateLeaderboard(
    players: Player[],
    allScores: Score[],
    pars: number[],
    scoringSystem: ScoringSystem,
    playerHandicaps?: Map<string, number>
): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const player of players) {
        const playerScores = allScores.filter(s => s.playerId === player.id);

        // Skip players with no scores
        if (playerScores.length === 0) continue;

        const grossScore = calculateStrokePlay(playerScores);
        let netScore = grossScore;
        let handicap = player.handicap || 0;
        let points = 0;

        switch (scoringSystem) {
            case 'stroke':
                // Use player's existing handicap for net
                if (playerHandicaps?.has(player.id)) {
                    handicap = playerHandicaps.get(player.id) || 0;
                }
                netScore = grossScore - handicap;
                break;

            case 'stableford':
                points = calculateStableford(playerScores, pars);
                netScore = points; // For sorting
                break;

            case '36system':
                const result36 = calculate36System(grossScore);
                handicap = result36.handicap;
                netScore = result36.net;
                break;

            case 'callaway':
                const resultCallaway = calculateCallaway(playerScores, pars);
                handicap = resultCallaway.handicap;
                netScore = resultCallaway.net;
                break;
        }

        entries.push({
            player,
            grossScore,
            netScore,
            handicap,
            points,
            rank: 0,
            thru: playerScores.filter(s => s.hole > 0 && s.hole <= 18).length
        });
    }

    // Sort entries
    if (scoringSystem === 'stableford') {
        // Stableford: highest points first
        entries.sort((a, b) => b.points - a.points);
    } else {
        // Others: lowest net score first
        entries.sort((a, b) => a.netScore - b.netScore);
    }

    // Assign ranks
    entries.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    return entries;
}

/**
 * Get scoring system display name
 */
export function getScoringSystemName(system: ScoringSystem, locale: string = 'th'): string {
    const names: Record<ScoringSystem, Record<string, string>> = {
        stroke: { th: 'Stroke Play (สโตรกเพลย์)', en: 'Stroke Play' },
        stableford: { th: 'Stableford (สเตเบิลฟอร์ด)', en: 'Stableford' },
        '36system': { th: '36 System (ระบบ 36)', en: '36 System' },
        callaway: { th: 'Callaway (คาลลาเวย์)', en: 'Callaway' },
    };
    return names[system]?.[locale] || names[system]?.en || system;
}
