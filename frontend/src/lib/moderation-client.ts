"use client";

import { apiRequest } from "@/lib/api";

// R10-BUG-2: server actions для approve/reject выкидывали 503
// "Failed to find Server Action 'true'" после rebuild — клиентский bundle
// держал ссылку на старый action ID, а сервер уже знал только новый.
// Решение: вызывать Django API напрямую с клиента, минуя server action
// маршрутизацию Next.js. Bearer токен прокидываем пропом из SSR (page.tsx).

export async function approvePostClient(postId: number, accessToken: string) {
    if (!accessToken) {
        return { error: "Нет токена авторизации" };
    }
    try {
        await apiRequest(`/moderation/${postId}/approve/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return { success: true as const };
    } catch (e: any) {
        return { error: e?.message || "Ошибка одобрения" };
    }
}

export async function rejectPostClient(
    postId: number,
    reason: string,
    accessToken: string,
) {
    if (!accessToken) {
        return { error: "Нет токена авторизации" };
    }
    try {
        await apiRequest(`/moderation/${postId}/reject/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ rejection_reason: reason ?? "" }),
        });
        return { success: true as const };
    } catch (e: any) {
        return { error: e?.message || "Ошибка отклонения" };
    }
}
