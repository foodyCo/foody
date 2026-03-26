import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    // Используем данные из сессии, так как на бэкенде пока нет эндпоинта /users/me/
    const user = {
        id: (session.user as any).id || session.user.email,
        name: session.user.name || "",
        email: session.user.email,
        image: session.user.image || ""
    };

    return <SettingsForm user={user as any} />;
}
