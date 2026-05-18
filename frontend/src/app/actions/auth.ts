"use server";

import { apiRequest } from "@/lib/api";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const city = (formData.get("city") as string)?.trim() ?? "";

    if (!name || !email || !password || !city) {
        return { error: "Все поля обязательны" };
    }

    try {
        const registrationData = {
            username: email.split('@')[0] + "_" + Math.floor(Math.random() * 1000),
            email,
            password,
            password_confirm: password,
            full_name: name,
            city,
        };

        await apiRequest("/users/register/", {
            method: "POST",
            body: JSON.stringify(registrationData),
        });

        // Автоматический вход после успешной регистрации
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            return { success: true };
        } catch (error) {
            return { success: true, warning: "Аккаунт создан, но не удалось выполнить автоматический вход" };
        }
    } catch (error: any) {
        console.error("Registration error:", error);
        let message = "Ошибка при регистрации";
        
        try {
            // Пытаемся распарсить детализированные ошибки от Django
            const errorObj = JSON.parse(error.message);
            if (typeof errorObj === 'object') {
                const FIELD_LABELS: Record<string, string> = {
                    username: "Логин",
                    email: "Email",
                    password: "Пароль",
                    password_confirm: "Подтверждение пароля",
                    full_name: "Имя",
                    city: "Город",
                    non_field_errors: "Ошибка"
                };

                const details = Object.entries(errorObj)
                    .map(([key, value]) => {
                        const label = FIELD_LABELS[key] || key;
                        const val = Array.isArray(value) ? value[0] : value;
                        return `${label}: ${val}`;
                    })
                    .join(". ");
                message = details;
            }
        } catch (e) {
            message = error.message || message;
        }
        
        return { error: message };
    }
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        const result = await signIn("credentials", {
            ...Object.fromEntries(formData),
            redirect: false,
        });
        
        // В NextAuth v5 signIn с redirect: false может возвращать объект с ошибкой, а не выбрасывать исключение
        if (result?.error) {
            return "Неверный email или пароль";
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch ((error as any).type) {
                case "CredentialsSignin":
                    return "Неверный email или пароль";
                default:
                    return "Произошла ошибка при входе";
            }
        }
        // Если это не редирект и не AuthError, логируем и возвращаем ошибку
        console.error("Auth Exception:", error);
        return "Неверный email или пароль"; // fallback
    }

    redirect("/me");
}
