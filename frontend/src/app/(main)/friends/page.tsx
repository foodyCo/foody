import FeedItem from "@/components/FeedItem";
import { getFriendsPosts } from "@/app/actions/social";
import { auth } from "@/auth";
import { mapDjangoPostToDish } from "@/lib/api";

export default async function Friends() {
    const session = await auth() as any;
    const posts = await getFriendsPosts(session?.user?.accessToken);

    const dishes = posts.map((post: any) => ({
        dish: mapDjangoPostToDish(post),
        isLiked: post.is_liked,
        isSubscribed: false // Бэкенд пока не отдает подписки
    }));

    return (
        <div className="feed-container" style={{ paddingBottom: "80px" }}>
            <div style={{ padding: "16px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "4px" }}>Друзья</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                    Посмотрите, что едят ваши друзья (взаимные подписки)
                </p>
            </div>

            <div>
                {dishes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                        <p>Здесь появятся посты ваших взаимных друзей.</p>
                        <p style={{ fontSize: "12px", marginTop: "8px" }}>Подпишитесь друг на друга, чтобы видеть посты здесь!</p>
                    </div>
                ) : (
                    dishes.map(({ dish, isLiked, isSubscribed }: any) => (
                        <FeedItem
                            key={dish.id}
                            dish={dish}
                            initialIsLiked={isLiked}
                            initialIsSubscribed={isSubscribed}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
