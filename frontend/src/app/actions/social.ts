"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function toggleLike(dishId: string) {
    const session = await auth();
    if (!session?.user?.accessToken) return { error: "Not authenticated" };

    try {
        const res = await fetch(`http://backend:8000/api/posts/${dishId}/like/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
        });
        if (!res.ok) throw new Error("Failed to like");
        revalidatePath(`/dish/${dishId}`);
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function toggleSave(dishId: string) {
    const session = await auth();
    if (!session?.user?.accessToken) return { error: "Not authenticated" };

    try {
        const res = await fetch(`http://backend:8000/api/posts/${dishId}/favorite/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
        });
        if (!res.ok) throw new Error("Failed to save");
        revalidatePath(`/dish/${dishId}`);
        revalidatePath('/favorites');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getDishComments(dishId: string) {
    const session = await auth();
    
    // Attempt with or without auth depending on backend rules
    const headers: HeadersInit = {};
    if (session?.user?.accessToken) {
        headers["Authorization"] = `Bearer ${(session.user as any).accessToken}`;
    }

    try {
        const res = await fetch(`http://backend:8000/api/posts/${dishId}/comments/`, {
            headers,
            cache: 'no-store'
        });
        if (!res.ok) throw new Error("Failed to fetch comments");
        return await res.json();
    } catch (e: any) {
        console.error(e);
        return [];
    }
}

export async function createComment(dishId: string, text: string) {
    const session = await auth();
    if (!session?.user?.accessToken) return { error: "Not authenticated" };

    try {
        const res = await fetch(`http://backend:8000/api/posts/${dishId}/comments/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to create comment");
        revalidatePath(`/dish/${dishId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getCurrentUserAvatar() {
    const session = await auth();
    if (!session?.user?.accessToken) return null;

    try {
        const res = await fetch(`http://backend:8000/api/users/me/`, {
            headers: {
                Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.avatar || null;
    } catch (e: any) {
        return null;
    }
}
