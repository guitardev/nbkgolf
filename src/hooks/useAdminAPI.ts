"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminAPI() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const makeRequest = useCallback(async (
        url: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
        body?: any
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            const options: RequestInit = {
                method,
                headers,
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Player operations
    const createPlayer = useCallback((data: any) => {
        return makeRequest('/api/players', 'POST', data);
    }, [makeRequest]);

    const updatePlayer = useCallback((id: string, updates: any) => {
        return makeRequest('/api/players', 'PATCH', { id, ...updates });
    }, [makeRequest]);

    const deletePlayer = useCallback((id: string) => {
        return makeRequest(`/api/players?id=${id}`, 'DELETE');
    }, [makeRequest]);

    // Course operations
    const createCourse = useCallback((data: any) => {
        return makeRequest('/api/courses', 'POST', data);
    }, [makeRequest]);

    const updateCourse = useCallback((id: string, updates: any) => {
        return makeRequest('/api/courses', 'PATCH', { id, ...updates });
    }, [makeRequest]);

    const deleteCourse = useCallback((id: string) => {
        return makeRequest(`/api/courses?id=${id}`, 'DELETE');
    }, [makeRequest]);

    // Tournament operations
    const createTournament = useCallback((data: any) => {
        return makeRequest('/api/tournaments', 'POST', data);
    }, [makeRequest]);

    const updateTournament = useCallback((id: string, updates: any) => {
        return makeRequest('/api/tournaments', 'PATCH', { id, ...updates });
    }, [makeRequest]);

    const deleteTournament = useCallback((id: string) => {
        return makeRequest(`/api/tournaments?id=${id}`, 'DELETE');
    }, [makeRequest]);

    // Registration operations (now using TournamentPlayers)
    const updateRegistration = useCallback((id: string, updates: any) => {
        return makeRequest('/api/tournament-players', 'PATCH', { id, ...updates });
    }, [makeRequest]);

    const deleteRegistration = useCallback((id: string) => {
        return makeRequest(`/api/tournament-players?id=${id}`, 'DELETE');
    }, [makeRequest]);

    // Score operations
    const addScore = useCallback((data: any) => {
        return makeRequest('/api/scores', 'POST', data);
    }, [makeRequest]);

    return {
        isLoading,
        error,
        createPlayer,
        updatePlayer,
        deletePlayer,
        createCourse,
        updateCourse,
        deleteCourse,
        createTournament,
        updateTournament,
        deleteTournament,
        updateRegistration,
        deleteRegistration,
        addScore,
    };
}
