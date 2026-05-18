import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { apiRequest, fixMediaUrl } from "@/lib/api";
import CommentsSection from "./CommentsSection";
import styles from "./page.module.css";
import { redirect } from "next/navigation";

export default async function CommentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth() as any;
    
    // Получаем детали поста для фона
    let postData = null;
    let comments = [];

    try {
        postData = await apiRequest(`/posts/${id}/`);
        
        try {
            const commentsData = await apiRequest(`/posts/${id}/comments/`);
            const rawComments = commentsData.results || commentsData || [];
            comments = rawComments.map((c: any) => ({
                id: c.id,
                user: {
                    id: c.user_detail?.id || c.user?.id || c.user || 0,
                    username: c.user_detail?.username || c.user?.username || "Аноним",
                    image: fixMediaUrl(c.user_detail?.avatar || c.user?.avatar) || "/default-avatar.svg"
                },
                text: c.text,
                created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'Только что',
                likes: 0
            }));
        } catch (e) {
            console.error("No comments endpoint found, falling back to empty", e);
        }
    } catch (e) {
        console.error("Error loading post data", e);
        postData = null;
    }

    if (!postData) {
        redirect(`/dish/${id}`);
    }

    const dishName = postData?.dish_name || "Название блюда";
    const restaurantName = postData?.restaurant_name || "Ресторан";
    const rating = Math.round(postData?.statistics?.rating || 0);
    const coverImage = fixMediaUrl(postData?.images?.[0]?.image) || "/placeholder.png";
    const myAvatar = session?.user?.image || "/default-avatar.svg";

    let currentUserId: number | null = null;
    if (session?.user?.accessToken) {
        try {
            const me = await apiRequest("/users/me/", {
                headers: { Authorization: `Bearer ${session.user.accessToken}` },
            });
            currentUserId = me?.id ?? null;
        } catch { /* ignore */ }
    }

    return (
        <div className={styles.container}>
            {/* BACKGROUND SCREEN (Dish Detail Screen Overlay) */}
            <main className={styles.backgroundMain}>
                <div className={styles.bgWrapper}>
                    <Image 
                        src={coverImage}
                        alt={dishName}
                        fill
                        className={styles.bgImage}
                    />
                    <div className={styles.bgGradient}></div>
                    <div className={styles.bgContent}>
                        <div className={styles.bgCard}>
                            <span className={styles.cuisineTag}>{restaurantName}</span>
                            <h1 className={styles.dishTitle}>{dishName}</h1>
                            <div className={styles.statsRow}>
                                <div className={styles.ratingBadge}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: `'FILL' 1` }}>star</span>
                                    <span>{rating}</span>
                                </div>
                                <span className={styles.dot}>•</span>
                                <span className={styles.authorBadge}>
                                    {postData?.user ? `От ${postData.user.username}` : "Автор неизвестен"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* BOTTOM SHEET OVERLAY */}
            <Link href={`/dish/${id}`} className={styles.overlay}></Link>

            {/* THE BOTTOM SHEET CONTAINER */}
            <CommentsSection
                postId={id}
                initialComments={comments}
                myAvatar={myAvatar}
                isAuthenticated={!!session}
                accentRedirect={`/dish/${id}`}
                currentUserId={currentUserId}
            />
        </div>
    );
}
