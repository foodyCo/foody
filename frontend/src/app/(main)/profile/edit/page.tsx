import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { apiRequest, fixMediaUrl } from "@/lib/api";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
    const session = await auth() as any;

    if (!session?.user?.accessToken) {
        redirect("/login");
    }

    let userProfile = null;
    try {
        userProfile = await apiRequest("/users/me/", {
            headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
    } catch (e: any) {
        if (e.message === "UNAUTHORIZED") {
            redirect("/login");
        }
        console.error("Failed to load user profile", e);
    }

    const defaultAvatar = "/default-avatar.svg";

    const initialData = {
        name: userProfile?.full_name || userProfile?.username || session.user.name || "Пользователь",
        username: userProfile?.username || session.user.name?.toLowerCase().replace(/\s+/g, '_') || "user",
        avatar: fixMediaUrl(userProfile?.avatar) || session.user.image || defaultAvatar,
        bio: userProfile?.bio_text || "",
        city: userProfile?.city || "",
    };

    return <EditProfileForm initialData={initialData} />;
}
