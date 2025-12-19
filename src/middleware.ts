import { getToken } from "next-auth/jwt";
import createMiddleware from "next-intl/middleware";
import { locales } from "./i18n";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: "en",
});

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;

    // Get the token from the request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isLoggedIn = !!token;

    // Check if visiting dashboard
    const isDashboard = nextUrl.pathname.includes("/dashboard");

    if (isDashboard && !isLoggedIn) {
        // Redirect to home page (which has login button)
        return NextResponse.redirect(new URL("/", nextUrl));
    }

    return intlMiddleware(req);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
