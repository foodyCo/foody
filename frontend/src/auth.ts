import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

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
                    
                    // Возвращаем объект пользователя с токенами
                    return {
                        id: email, 
                        email: email,
                        accessToken: tokens.access,
                        refreshToken: tokens.refresh,
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
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).accessToken = token.accessToken
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
})
