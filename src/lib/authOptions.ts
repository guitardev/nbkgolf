// NextAuth v4 configuration
// Shared auth options for API routes and middleware

import { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        LineProvider({
            clientId: process.env.AUTH_LINE_ID || "",
            clientSecret: process.env.AUTH_LINE_SECRET || "",
            authorization: {
                params: {
                    scope: "profile openid email",
                },
            },
        }),
        CredentialsProvider({
            name: "Test Admin",
            credentials: {},
            async authorize(credentials, req) {
                return { id: "test-admin-id", name: "Test Admin", email: "admin@test.com" };
            }
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                // Check if user is admin
                const adminIds = (process.env.NEXT_PUBLIC_ADMIN_LINE_IDS || "")
                    .split(",")
                    .map((id) => id.trim());

                let isAdmin = adminIds.includes(user.id || "");

                // FORCE ADMIN FOR TEST USER
                if (user.id === 'test-admin-id') {
                    isAdmin = true;
                }

                token.role = isAdmin ? "admin" : "user";
                token.id = user.id || "";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role as string;
                (session.user as any).id = token.id as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
