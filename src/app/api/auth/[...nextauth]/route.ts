import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/googleSheets";

// Add callbacks to authOptions to handle auto-registration
const extendedAuthOptions = {
    ...authOptions,
    callbacks: {
        ...authOptions.callbacks,
        async signIn({ user }: { user: any }) {
            if (!user?.id) return true;

            try {
                // Check if player exists
                const players = await db.players.getAll();
                const existingPlayer = players.find(p => p.lineUserId === user.id);

                if (!existingPlayer) {
                    console.log(`New user detected: ${user.name} (${user.id}). Creating profile...`);
                    // Create new player with available info
                    await db.players.add({
                        id: Date.now().toString(),
                        name: user.name || 'New Golfer',
                        email: user.email || '',
                        lineUserId: user.id,
                        handicap: 0,
                        team: '',
                        // Phone is intentionally left empty to force profile completion
                    });
                }
                return true;
            } catch (error) {
                console.error("Error in signIn callback:", error);
                // Allow sign in even if DB update fails (prevent lockout)
                return true;
            }
        }
    }
};

const handler = NextAuth(extendedAuthOptions);

export { handler as GET, handler as POST };
