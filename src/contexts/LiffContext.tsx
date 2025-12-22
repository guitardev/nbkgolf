"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Liff } from "@line/liff";

interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    email?: string;
}

interface LiffContextType {
    liff: Liff | null;
    profile: LiffProfile | null;
    isInClient: boolean;
    error: string | null;
    login: () => void;
    logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

// Define the LIFF ID directly or via env var
const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || "";

export function LiffProvider({ children }: { children: React.ReactNode }) {
    const [liff, setLiff] = useState<Liff | null>(null);
    const [profile, setProfile] = useState<LiffProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInClient, setIsInClient] = useState(false);

    useEffect(() => {
        if (!LIFF_ID) {
            console.warn("LIFF_ID is not defined in environment variables.");
            return;
        }

        const initLiff = async () => {
            try {
                // Dynamically import @line/liff to avoid SSR issues
                const { default: liffModule } = await import("@line/liff");

                await liffModule.init({ liffId: LIFF_ID });
                setLiff(liffModule);

                const inClient = liffModule.isInClient();
                setIsInClient(inClient);

                if (inClient && liffModule.isLoggedIn()) {
                    const profile = await liffModule.getProfile();
                    setProfile({
                        userId: profile.userId,
                        displayName: profile.displayName,
                        pictureUrl: profile.pictureUrl,
                        email: liffModule.getDecodedIDToken()?.email
                    });
                }
            } catch (err: any) {
                console.error("LIFF initialization failed", err);
                setError(err.message || "Failed to initialize LIFF");
            }
        };

        initLiff();
    }, []);

    const login = () => {
        if (liff && !liff.isLoggedIn()) {
            liff.login();
        }
    };

    const logout = () => {
        if (liff && liff.isLoggedIn()) {
            liff.logout();
            setProfile(null);
            window.location.reload();
        }
    };

    return (
        <LiffContext.Provider value={{ liff, profile, isInClient, error, login, logout }}>
            {children}
        </LiffContext.Provider>
    );
}

export function useLiff() {
    const context = useContext(LiffContext);
    if (context === undefined) {
        throw new Error("useLiff must be used within a LiffProvider");
    }
    return context;
}
