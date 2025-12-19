export const isAdminUser = (userId: string): boolean => {
    const adminIds = (process.env.NEXT_PUBLIC_ADMIN_LINE_IDS || "").split(',').map(id => id.trim());
    return adminIds.includes(userId);
};
