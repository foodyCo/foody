"use server"

import { revalidatePath } from "next/cache";
import { apiRequest } from "@/lib/api";

export async function updateProfile(formData: FormData, accessToken: string) {
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
