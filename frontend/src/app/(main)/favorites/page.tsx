import { auth } from "@/auth";
import RestaurantCard from "@/components/RestaurantCard";
import { redirect } from "next/navigation";
import { apiRequest, mapDjangoPostToDish } from "@/lib/api";

export default async function Favorites() {
    const session = await auth() as any;

    if (!session?.user?.accessToken) {
        redirect("/login");
    }

    try {
        const data = await apiRequest("/posts/saved/", {
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`
            }
        });

        const results = data.results || data;
        const favoriteDishes = Array.isArray(results) ? results.map(mapDjangoPostToDish) : [];

        return (
            <div className="feed-container" style={{ padding: "16px", paddingBottom: "80px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "24px" }}>Избранное</h1>

                {favoriteDishes.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#888", marginTop: "40px" }}>
                        <p>У вас пока нет избранных блюд.</p>
                    </div>
                ) : (
                    <div>
                        {favoriteDishes.map((dish) => (
                            <RestaurantCard key={dish.id} dish={dish} />
                        ))}
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error("Favorites load error:", error);
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <p>Ошибка при загрузке избранного</p>
            </div>
        );
    }
}
