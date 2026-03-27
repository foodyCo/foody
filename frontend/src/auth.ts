import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

function decodeJwtPayload(jwt: string) {
    try {
        return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
    } catch { return null; }
}

async function refreshAccessToken(token: any) {
    try {
        const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const response = await fetch(`${API_URL}/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: token.refreshToken }),
        });
        if (!response.ok) return { ...token, error: "RefreshAccessTokenError" };
        const data = await response.json();
        const payload = decodeJwtPayload(data.access);
        return {
            ...token,
            accessToken: data.access,
            accessTokenExpires: payload?.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000,
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
                    const payload = decodeJwtPayload(tokens.access);

                    return {
                        id: payload?.user_id?.toString() ?? email,
                        email: email,
                        accessToken: tokens.access,
                        refreshToken: tokens.refresh,
                        accessTokenExpires: payload?.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000,
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
            if (user) {
                token.accessToken = (user as any).accessToken
                token.refreshToken = (user as any).refreshToken
                token.accessTokenExpires = (user as any).accessTokenExpires
                token.userId = (user as any).id
                return token
            }

            // Return early if token hasn't expired yet (with 60s buffer)
            if (Date.now() < (token.accessTokenExpires as number) - 60000) {
                return token
            }

            return refreshAccessToken(token)
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).accessToken = token.accessToken
                ;(session.user as any).id = token.userId
                ;(session.user as any).error = token.error
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})
