"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { isAdminUser } from '@/lib/admin';
import { Player } from '@/lib/googleSheets'; // We can import the type, but not the db logic

interface UserProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    memberProfile: Player | null;
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [memberProfile, setMemberProfile] = useState<Player | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const fetchMemberProfile = async (lineUserId: string) => {
        try {
            const res = await fetch(`/api/profile?lineUserId=${lineUserId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.found) {
                    setMemberProfile(data.player);
                } else {
                    setMemberProfile(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch member profile", error);
        } finally {
            setIsProfileLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchMemberProfile(session.user.id);
            // Check admin status from session role
            setIsAdmin(session.user.role === 'admin');
        } else {
            setMemberProfile(null);
            setIsAdmin(false);
            if (status !== "loading") {
                setIsProfileLoading(false);
            }
        }
    }, [session, status]);

    const login = () => {
        signIn("line");
    };

    const logout = () => {
        signOut();
    };

    const refreshProfile = async () => {
        if (session?.user?.id) {
            await fetchMemberProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{
            user: session?.user ? {
                userId: session.user.id,
                displayName: session.user.name || '',
                pictureUrl: session.user.image || undefined
            } : null,
            memberProfile,
            isAdmin,
            login,
            logout,
            isLoading: status === "loading" || isProfileLoading,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
