// Server-side admin check utility
// This should only be used in API routes (server-side)

export function checkAdminAuth(userId: string | null | undefined): boolean {
    if (!userId) return false;

    const adminIds = (process.env.NEXT_PUBLIC_ADMIN_LINE_IDS || "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);

    return adminIds.includes(userId);
}

export function getUnauthorizedResponse() {
    return Response.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
    );
}
