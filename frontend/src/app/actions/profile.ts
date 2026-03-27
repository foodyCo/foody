"use server"

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api";
import { auth } from "@/auth";

export async function updateProfile(formData: FormData) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "UNAUTHORIZED" };
    }

    try {
        await apiRequest("/users/me/", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`
            },
            body: formData as any
        });

        revalidatePath("/profile");
        revalidatePath("/profile/edit");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { error: error.message || "Ошибка при обновлении профиля" };
    }
}
