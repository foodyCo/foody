"use server"

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { apiRequest } from "@/lib/api";

// Токен берём из сессии на СЕРВЕРЕ — клиент его не передаёт (2-й аргумент
// оставлен для совместимости вызова из формы, но игнорируется).
export async function updateProfile(formData: FormData, _accessToken?: string) {
    const session = (await auth()) as any;
    const accessToken: string | undefined = session?.user?.accessToken;
    if (!accessToken) {
        return { error: "Необходимо войти в систему" };
    }
    try {
        await apiRequest("/users/me/", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            body: formData as any
        });

        revalidatePath("/profile");
        revalidatePath("/profile/edit");
        revalidatePath("/me");
        revalidatePath("/me/edit");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { error: error.message || "Ошибка при обновлении профиля" };
    }
}
