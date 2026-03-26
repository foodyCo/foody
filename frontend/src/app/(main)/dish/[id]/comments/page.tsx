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
                    id: c.user?.id || 0,
                    username: c.user?.username || "Аноним",
                    image: fixMediaUrl(c.user?.avatar) || ""
                },
                text: c.text,
                created_at: new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                likes: 0
            }));
        } catch (e) {
            console.error("No comments endpoint found, falling back to empty", e);
        }
    } catch (e) {
        console.error("Error loading post data", e);
        // Fallback for UI visualization
        postData = {
            id,
            dish: { name: "Signature Tonkotsu Ramen" },
            restaurant: { name: "Japanese Cuisine" },
            images: [
                { image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoOvekwGy6jO-3Q8OJJRQUJhF_A_C5vcRt6gPPfvd9GjbWwNxy7Wawky5QC1pSCU0ZBQYaocwCw4R6zP5mJXG8c7bCQj-56OO1VsnothrVoKBRL4a97h_mGHezTiqa_ZxK3jhyqsIJUZcwEFVF3eo_WU9oL6QcsI1th6pq80q7jeD3Vz2rkv3fx6k7ocVVWHje19CRcjWb0X6j721tCRrxWOZaNASVILxEtGqWqpqGZ4wZ9Z4GZVmw-RZL6eEunk-1b9BLMsCsgM5v" }
            ],
            statistics: { rating_taste: 4.9 }
        };
    }

    const dishName = postData?.dish?.name || "Название блюда";
    const restaurantName = postData?.restaurant?.name || "Ресторан";
    const rating = postData?.statistics?.rating_taste?.toFixed(1) || "0.0";
    const coverImage = fixMediaUrl(postData?.images?.[0]?.image) || "https://lh3.googleusercontent.com/aida-public/AB6AXuBoOvekwGy6jO-3Q8OJJRQUJhF_A_C5vcRt6gPPfvd9GjbWwNxy7Wawky5QC1pSCU0ZBQYaocwCw4R6zP5mJXG8c7bCQj-56OO1VsnothrVoKBRL4a97h_mGHezTiqa_ZxK3jhyqsIJUZcwEFVF3eo_WU9oL6QcsI1th6pq80q7jeD3Vz2rkv3fx6k7ocVVWHje19CRcjWb0X6j721tCRrxWOZaNASVILxEtGqWqpqGZ4wZ9Z4GZVmw-RZL6eEunk-1b9BLMsCsgM5v";
    const myAvatar = session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCbJXyY8qcB2BJfgl3oMVfCtgT8hq3HUBgNO0ehmVvnaJ0Nmn7KPbvTQhN4zsqbWv4VNN_sV2mn9XUGsLYpxoM8cO5nnpshcfLvRphByeK1vvEPn-j3WLldF6RXdLkY9IxM79dUzLssZLokhcmol4K7MMfkRAC9ybmu7akI4vwp2flJPf3W3m8XR2C5Yy9nOZ7P5YEUKZUr_cs3QWRmy9AZZv0sBvvfKStVK0tyyBezwg-3mr9Ki5oPhdI661UvS_jatHv1j-ZCc-74";
    
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
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fill: 1 }}>star</span>
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
            />
        </div>
    );
}
