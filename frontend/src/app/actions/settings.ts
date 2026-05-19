"use server";

import { auth, signOut } from "@/auth";
import { apiRequest } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

/**
 * Server Action для logout. Используется вместо клиентского signOut() из
 * `next-auth/react` — за обратным прокси (Caddy → frontend:3000) клиентский
 * вариант валится с MissingCSRF в NextAuth v5 beta.30.
 *
 * Дополнительно: NextAuth `signOut({redirect:true})` за прокси иногда не
 * успевает прокинуть Set-Cookie через response — браузер сохраняет старый
 * `__Secure-authjs.session-token` и /api/auth/session продолжает отдавать
 * юзера. Поэтому явно удаляем все возможные имена session-cookie через
 * `cookies()` API из `next/headers`, а потом редиректим вручную.
 */
export async function signOutAction() {
    await signOut({ redirect: false });
    const cookieStore = await cookies();
    // NextAuth v5 кладёт session-token под одним из этих имён в зависимости
    // от HTTPS / proxy / Host. Удаляем все варианты — лишние не помешают.
    for (const name of [
        "__Secure-authjs.session-token",
        "authjs.session-token",
        "__Host-authjs.csrf-token",
        "authjs.csrf-token",
        "__Secure-authjs.callback-url",
        "authjs.callback-url",
    ]) {
        cookieStore.delete(name);
    }
    redirect("/login");
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
