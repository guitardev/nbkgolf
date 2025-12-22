import { google } from 'googleapis';

// Interface definitions
export interface Player {
    id: string;
    name: string;
    lineUserId?: string;
    handicap: number;
    team?: string;
    email?: string;
    phone?: string;
}

export interface Tournament {
    id: string;
    name: string;
    date: string;
    courseId: string;
    status: 'upcoming' | 'active' | 'completed';
    scoringSystem?: 'stroke' | 'stableford' | '36system' | 'callaway';
}

export interface Score {
    tournamentId: string;
    playerId: string;
    hole: number;
    strokes: number;
    par: number;
}

export interface Course {
    id: string;
    name: string;
    pars: number[]; // Array of 18 pars
    distances?: number[]; // Array of 18 distances
}



export interface TournamentPlayer {
    id: string;
    tournamentId: string;
    playerId?: string;           // For members
    guestName?: string;          // For guests
    guestEmail?: string;
    guestPhone?: string;
    team: string;
    registeredAt: string;
    status: 'pending' | 'registered' | 'confirmed' | 'paid' | 'withdrawn';
}

// Google Sheets Setup
let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
// Remove any wrapping quotes that might be in the environment variable
privateKey = privateKey.replace(/^["']|["']$/g, '');
// If the key contains actual newlines, use it as is.
// Otherwise, replace literal \n with actual newlines.
const formattedKey = privateKey.includes('\n') ? privateKey : privateKey.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formattedKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Helper to get sheet data
async function getSheetData(range: string) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range,
        });
        return response.data.values || [];
    } catch (error) {
        console.error(`Error reading sheet ${range}:`, error);
        return [];
    }
}

// Helper to append data
async function appendSheetData(range: string, values: any[]) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });
        return true;
    } catch (error) {
        console.error(`Error appending to sheet ${range}:`, error);
        return false;
    }
}

// Helper to update a row
async function updateSheetRow(range: string, rowIndex: number, values: any[]) {
    try {
        const cellRange = `${range.split('!')[0]}!A${rowIndex}:${String.fromCharCode(64 + values.length)}${rowIndex}`;
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: cellRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });
        return true;
    } catch (error) {
        console.error(`Error updating row ${rowIndex} in ${range}:`, error);
        return false;
    }
}

// Helper to delete a row (by clearing it)
async function deleteSheetRow(range: string, rowIndex: number) {
    try {
        const sheetName = range.split('!')[0];
        const cellRange = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: cellRange,
        });
        return true;
    } catch (error) {
        console.error(`Error deleting row ${rowIndex} in ${range}:`, error);
        return false;
    }
}

// Helper to find row index by ID
async function findRowIndexById(range: string, id: string): Promise<number | null> {
    try {
        const rows = await getSheetData(range);
        const index = rows.findIndex((row) => row[0] === id);
        return index !== -1 ? index + 2 : null; // +2 because: 0-indexed array + header row
    } catch (error) {
        console.error(`Error finding row in ${range}:`, error);
        return null;
    }
}


export const db = {
    players: {
        getAll: async (): Promise<Player[]> => {
            const rows = await getSheetData('Players!A2:G');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                lineUserId: row[2],
                handicap: Number(row[3]),
                team: row[4],
                email: row[5],
                phone: row[6],
            }));
        },
        add: async (player: Player) => {
            return await appendSheetData('Players!A:G', [
                player.id,
                player.name,
                player.lineUserId || '',
                player.handicap,
                player.team || '',
                player.email || '',
                player.phone ? `'${player.phone}` : '',
            ]);
        },
        update: async (id: string, player: Partial<Player>) => {
            const rowIndex = await findRowIndexById('Players!A2:G', id);
            if (!rowIndex) return false;

            const existing = await db.players.getAll();
            const current = existing.find(p => p.id === id);
            if (!current) return false;

            const updated = { ...current, ...player };
            return await updateSheetRow('Players!A:G', rowIndex, [
                updated.id,
                updated.name,
                updated.lineUserId || '',
                updated.handicap,
                updated.team || '',
                updated.email || '',
                updated.phone ? `'${updated.phone}` : '',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Players!A2:G', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Players!A:G', rowIndex);
        },
    },
    tournaments: {
        getAll: async (): Promise<Tournament[]> => {
            const rows = await getSheetData('Tournaments!A2:F');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                date: row[2],
                courseId: row[3],
                status: row[4] as Tournament['status'],
                scoringSystem: (row[5] as Tournament['scoringSystem']) || 'stroke',
            }));
        },
        add: async (tournament: Tournament) => {
            return await appendSheetData('Tournaments!A:F', [
                tournament.id,
                tournament.name,
                tournament.date,
                tournament.courseId,
                tournament.status,
                tournament.scoringSystem || 'stroke',
            ]);
        },
        update: async (id: string, tournament: Partial<Tournament>) => {
            const rowIndex = await findRowIndexById('Tournaments!A2:F', id);
            if (!rowIndex) return false;

            const existing = await db.tournaments.getAll();
            const current = existing.find(t => t.id === id);
            if (!current) return false;

            const updated = { ...current, ...tournament };
            return await updateSheetRow('Tournaments!A:F', rowIndex, [
                updated.id,
                updated.name,
                updated.date,
                updated.courseId,
                updated.status,
                updated.scoringSystem || 'stroke',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Tournaments!A2:F', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Tournaments!A:F', rowIndex);
        },
    },
    scores: {
        // Updated to use Horizontal Format: [TournamentId, PlayerId, ScoreH1, ScoreH2, ..., ScoreH18]
        // This dramatically reduces row count (18x reduction).

        add: async (score: Score) => {
            // Adapter for legacy single-score add.
            // In horizontal mode, we prefer batch updates, but this supports existing calls.
            return await db.scores.upsert(score.tournamentId, score.playerId, { [score.hole]: score.strokes });
        },

        upsert: async (tournamentId: string, playerId: string, newScores: { [hole: number]: number }) => {
            const range = 'Scores!A2:T'; // A=TID, B=PID, C-T=H1-H18
            const rows = await getSheetData(range);
            const rowIndex = rows.findIndex(r => r[0] === tournamentId && r[1] === playerId);

            if (rowIndex !== -1) {
                // Update existing row
                // Construct the full array to update (or just specific cells if we optimize later)
                // For now, read existing -> merge -> write full row is safer than cell math without locking
                const currentRow = rows[rowIndex];
                const updatedValues = [...currentRow];

                Object.entries(newScores).forEach(([hole, strokes]) => {
                    const colIndex = 1 + Number(hole); // H1 is at index 2 (Col C)
                    updatedValues[colIndex] = strokes.toString();
                });

                // Calculate total (optional, stored in col 21/U if needed, but let's stick to simple first)
                // Actually, let's just update the specific range A:T
                return await updateSheetRow('Scores!A:T', rowIndex + 2, updatedValues);
            } else {
                // Create new row
                const newRow = new Array(20).fill('');
                newRow[0] = tournamentId;
                newRow[1] = playerId;

                Object.entries(newScores).forEach(([hole, strokes]) => {
                    const colIndex = 1 + Number(hole);
                    newRow[colIndex] = strokes.toString();
                });

                return await appendSheetData('Scores!A:T', newRow);
            }
        },

        getByTournament: async (tournamentId: string): Promise<Score[]> => {
            const rows = await getSheetData('Scores!A2:T');
            const scores: Score[] = [];

            const tournamentRows = rows.filter(r => r[0] === tournamentId);

            tournamentRows.forEach(row => {
                const pId = row[1];
                // Loop through columns 2-19 (Holes 1-18)
                for (let i = 2; i < 20; i++) {
                    const strokes = Number(row[i]);
                    if (strokes > 0) {
                        scores.push({
                            tournamentId,
                            playerId: pId,
                            hole: i - 1,
                            strokes: strokes,
                            par: 0 // Par is not stored in score anymore, populated by join or default
                        });
                    }
                }
            });

            return scores;
        },
    },
    courses: {
        getAll: async (): Promise<Course[]> => {
            const rows = await getSheetData('Courses!A2:D');
            return rows.map((row) => ({
                id: row[0],
                name: row[1],
                pars: row[2].split(',').map(Number),
                distances: row[3] ? row[3].split(',').map(Number) : [],
            }));
        },
        add: async (course: Course) => {
            return await appendSheetData('Courses!A:D', [
                course.id,
                course.name,
                `'${course.pars.join(',')}`,
                course.distances ? `'${course.distances.join(',')}` : '',
            ]);
        },
        update: async (id: string, course: Partial<Course>) => {
            const rowIndex = await findRowIndexById('Courses!A2:D', id);
            if (!rowIndex) return false;

            const existing = await db.courses.getAll();
            const current = existing.find(c => c.id === id);
            if (!current) return false;

            const updated = { ...current, ...course };
            return await updateSheetRow('Courses!A:D', rowIndex, [
                updated.id,
                updated.name,
                `'${updated.pars.join(',')}`,
                updated.distances ? `'${updated.distances.join(',')}` : '',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('Courses!A2:D', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('Courses!A:D', rowIndex);
        },
    },

    tournamentPlayers: {
        getAll: async (): Promise<TournamentPlayer[]> => {
            const rows = await getSheetData('TournamentPlayers!A2:I');
            return rows.map((row) => ({
                id: row[0],
                tournamentId: row[1],
                playerId: row[2] || undefined,
                team: row[3] || '',
                registeredAt: row[4],
                status: row[5] as TournamentPlayer['status'],
                guestName: row[6] || undefined,
                guestEmail: row[7] || undefined,
                guestPhone: row[8] || undefined,
            }));
        },
        getByTournament: async (tournamentId: string): Promise<TournamentPlayer[]> => {
            const all = await db.tournamentPlayers.getAll();
            return all.filter(tp => tp.tournamentId === tournamentId);
        },
        getByPlayer: async (playerId: string): Promise<TournamentPlayer[]> => {
            const all = await db.tournamentPlayers.getAll();
            return all.filter(tp => tp.playerId === playerId);
        },
        add: async (tournamentPlayer: TournamentPlayer) => {
            const success = await appendSheetData('TournamentPlayers!A:I', [
                tournamentPlayer.id,
                tournamentPlayer.tournamentId,
                tournamentPlayer.playerId || '',
                tournamentPlayer.team || '',
                tournamentPlayer.registeredAt,
                tournamentPlayer.status,
                tournamentPlayer.guestName || '',
                tournamentPlayer.guestEmail || '',
                tournamentPlayer.guestPhone ? `'${tournamentPlayer.guestPhone}` : '',
            ]);

            if (success && tournamentPlayer.playerId) {
                // Auto-initialize score row
                await db.scores.add({
                    tournamentId: tournamentPlayer.tournamentId,
                    playerId: tournamentPlayer.playerId,
                    hole: 0,
                    strokes: 0,
                    par: 0
                }).catch(err => console.error('Failed to auto-init score row:', err));
            }
            return success;
        },
        update: async (id: string, tournamentPlayer: Partial<TournamentPlayer>) => {
            const rowIndex = await findRowIndexById('TournamentPlayers!A2:I', id);
            if (!rowIndex) return false;

            const existing = await db.tournamentPlayers.getAll();
            const current = existing.find(tp => tp.id === id);
            if (!current) return false;

            const updated = { ...current, ...tournamentPlayer };
            return await updateSheetRow('TournamentPlayers!A:I', rowIndex, [
                updated.id,
                updated.tournamentId,
                updated.playerId || '',
                updated.team || '',
                updated.registeredAt,
                updated.status,
                updated.guestName || '',
                updated.guestEmail || '',
                updated.guestPhone ? `'${updated.guestPhone}` : '',
            ]);
        },
        delete: async (id: string) => {
            const rowIndex = await findRowIndexById('TournamentPlayers!A2:I', id);
            if (!rowIndex) return false;
            return await deleteSheetRow('TournamentPlayers!A:I', rowIndex);
        },
    },
};
