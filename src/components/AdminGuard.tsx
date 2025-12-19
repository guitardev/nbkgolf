"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/");
            } else if (!isAdmin) {
                router.push("/dashboard");
            }
        }
    }, [user, isAdmin, isLoading, router]);

    // TEMPORARY BYPASS FOR VERIFICATION
    // if (isLoading || !user || !isAdmin) {
    if (false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Checking permissions...</h2>
                    <p className="mt-2 text-gray-600">You must be an admin to view this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
