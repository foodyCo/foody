import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

async function refreshAccessToken(token: any) {
    try {
        const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_URL}/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: token.refreshToken }),
        });

        if (!response.ok) {
            throw new Error("RefreshAccessTokenError");
        }

        const refreshed = await response.json();
        return {
            ...token,
            accessToken: refreshed.access,
            // If backend also rotates refresh token, use the new one
            refreshToken: refreshed.refresh ?? token.refreshToken,
            accessTokenExpires: Date.now() + 55 * 60 * 1000, // 55 min
            error: undefined,
        };
    } catch {
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const email = credentials.email as string
                const password = credentials.password as string

                if (!email || !password) return null

                try {
                    const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

                    const response = await fetch(`${API_URL}/auth/token/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password }),
                    });

                    if (!response.ok) return null;

                    const tokens = await response.json();

                    // Fetch real user data to get Django user ID
                    let userId: number | null = null;
                    let username: string | null = null;
                    try {
                        const meResponse = await fetch(`${API_URL}/users/me/`, {
                            headers: { Authorization: `Bearer ${tokens.access}` },
                        });
                        if (meResponse.ok) {
                            const me = await meResponse.json();
                            userId = me.id ?? null;
                            username = me.username ?? null;
                        }
                    } catch {
                        // Non-fatal — id will fall back to email
                    }

                    return {
                        id: userId ? String(userId) : email,
                        email: email,
                        name: username,
                        accessToken: tokens.access,
                        refreshToken: tokens.refresh,
                        // Assume 60 min lifetime, refresh 5 min early
                        accessTokenExpires: Date.now() + 55 * 60 * 1000,
                    } as any;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in — copy from user object
            if (user) {
                token.accessToken = (user as any).accessToken
                token.refreshToken = (user as any).refreshToken
                token.accessTokenExpires = (user as any).accessTokenExpires
                return token
            }

            // Return previous token if it hasn't expired yet (with 60s buffer)
            const expiresAt = token.accessTokenExpires as number | undefined;
            if (expiresAt && Date.now() < expiresAt - 60 * 1000) {
                return token
            }

            // Access token has expired — try to refresh
            return refreshAccessToken(token)
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).accessToken = token.accessToken;
                (session.user as any).error = token.error;
                // Pass through the real Django user ID stored at login
                if (token.sub) {
                    session.user.id = token.sub;
                }
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})
