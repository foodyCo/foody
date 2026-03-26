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

    const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuCVqKo0rD50FVcxPyx63Wgx_ITuliGYflh1OSkByBsEkEvFEuAPiZuRed4mqQna6pJy0P9maE5ZVO9f_cADM_PLrIDIzqDCv9cwuhEE9DPgjfLx2kdmZtDNQrXw1OHvvTsjBUquMY3pTOoHnAMdne-3wBxCkiMQzGp4NWDPle5KmL0iw7ihuV20j4bVoUqBc3zBZrwaehTuxWAT4MLllYdvyRMRdqFSgealTXe8jKXHzN20PuXYxZj-9Lrzd8MY0LL47VdT6ouoleCX";

    const initialData = {
        name: userProfile?.full_name || userProfile?.username || session.user.name || "Пользователь",
        username: userProfile?.username || session.user.name?.toLowerCase().replace(/\s+/g, '_') || "user",
        avatar: fixMediaUrl(userProfile?.avatar) || session.user.image || defaultAvatar,
        bio: userProfile?.bio_text || "Exploring the soul of Rostov through one dish at a time. Ramen enthusiast and coffee lover. Always looking for the next hidden gem in the South of Russia."
    };

    return <EditProfileForm initialData={initialData} accessToken={session.user.accessToken} />;
}
