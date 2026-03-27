import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { apiRequest, fixMediaUrl } from "@/lib/api";
import StaffPanel from "./StaffPanel";

export default async function StaffPage() {
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
        if (e.message === "UNAUTHORIZED") redirect("/login");
    }

    if (!userProfile?.is_staff) {
        redirect("/");
    }

    let pendingPosts: any[] = [];
    let categories: any[] = [];

    try {
        const [moderationData, categoriesData] = await Promise.all([
            apiRequest("/moderation/", {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            }),
            apiRequest("/categories/", {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            }),
        ]);

        pendingPosts = moderationData?.results ?? moderationData ?? [];
        categories = categoriesData?.results ?? categoriesData ?? [];
    } catch (e) {
        console.error("Failed to load staff data", e);
    }

    const mapped = pendingPosts.map((p: any) => ({
        id: p.id,
        title: p.dish_name || p.title || "Без названия",
        author: p.user?.username || "—",
        authorId: p.user?.id || null,
        image: fixMediaUrl(p.images?.[0]?.image) || null,
        allImages: (p.images || []).map((img: any) => fixMediaUrl(img.image)).filter(Boolean),
        createdAt: p.created_at,
        description: p.description || "",
        price: p.price ? `${parseFloat(p.price).toFixed(0)} ₽` : null,
        restaurant: p.restaurant_name || "",
        tags: (p.tags || []).map((t: any) => t.name),
        rating: p.statistics?.rating || 0,
    }));

    return <StaffPanel
        pendingPosts={mapped}
        categories={categories}
        accessToken={session.user.accessToken}
    />;
}
