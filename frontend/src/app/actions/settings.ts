"use server";

import { auth, signOut } from "@/auth";
import { apiRequest } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    // В Django пока нет модели настроек пользователя в том виде, 
    // в котором они были в Prisma. Это требует расширения модели User.
    return { error: "Настройки профиля пока не поддерживаются бэкендом" };
}

export async function changePassword(formData: FormData) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    // Для смены пароля в Django обычно используется специальный эндпоинт
    return { error: "Смена пароля через API пока не реализована" };
}

export async function deleteAccount() {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    try {
        await apiRequest("/users/me/", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
            },
        });
        await signOut({ redirect: true, redirectTo: "/login" });
        return { success: true };
    } catch (error: any) {
        console.error("Delete account error:", error);
        // If the backend doesn't have this endpoint yet, still sign out
        if (error.message && error.message !== "UNAUTHORIZED") {
            return { error: "Удаление аккаунта временно недоступно. Обратитесь в поддержку." };
        }
        return { error: "Failed to delete account" };
    }
}
