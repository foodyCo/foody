import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiRequest, mapDjangoPostToDish, fixMediaUrl } from "@/lib/api";
import SubscribeButton from "@/components/SubscribeButton";
import styles from "../../profile/profile.module.css";

export default async function UserProfile({ params }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const session = await auth() as any;

    if (session?.user?.id?.toString() === id) {
        redirect("/profile");
    }

    let posts = [];
    let userData = null;

    try {
        const options: any = {};
        if (session?.user?.accessToken) {
            options.headers = {
                "Authorization": `Bearer ${session.user.accessToken}`
            };
        }

        const [postsData, userProfile] = await Promise.all([
            apiRequest(`/posts/user_posts/?user_id=${id}`, options).catch(() => ({ results: [] })),
            apiRequest(`/users/${id}/`, options).catch(() => null)
        ]);

        posts = Array.isArray(postsData.results || postsData) 
            ? (postsData.results || postsData).map(mapDjangoPostToDish) 
            : [];

        userData = {
            id: id,
            name: userProfile?.full_name || userProfile?.username || "Пользователь",
            handle: userProfile?.username?.toLowerCase() || `user_${id}`,
            avatar: fixMediaUrl(userProfile?.avatar) || "/default-avatar.svg",
            bio: userProfile?.bio_text || "Заядлый кулинар. Обожаю исследовать новые места!",
            location: "Неизвестно",
            stats: {
                posts: userProfile?.posts_count || posts.length,
                followers: userProfile?.followers_count || 0,
                following: userProfile?.following_count || 0
            },
            is_following: userProfile?.is_following || false
        };

    } catch (error) {
        console.error("User profile load error:", error);
        return <div style={{ padding: "40px", textAlign: "center" }}>Ошибка при загрузке профиля</div>;
    }

    return (
        <>
            <div className={styles.ambientBg}></div>

            <header className={styles.profileHeaderTop}>
                {/* Back button */}
                <Link href="/" className={styles.settingsBtn} style={{marginRight: 'auto', flex: 1, justifyContent: 'flex-start', color: '#000'}}>
                    <svg viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                        <polyline points="15 18 9 12 15 6" style={{fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'}}></polyline>
                    </svg>
                </Link>

                <div className={styles.username}>@{userData.handle}</div>

                <div style={{flex: 1, display: 'flex', justifyContent: 'flex-end'}}>
                    <button className={styles.settingsBtn} style={{color: '#000'}}>
                        <svg viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
            </header>

            <section className={styles.profileInfo}>
                <div className={styles.avatarContainer}>
                    <Image 
                        src={userData.avatar} 
                        alt={userData.name} 
                        className={styles.avatar} 
                        width={90} 
                        height={90} 
                    />
                    <div className={styles.verifiedBadge}>
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                    </div>
                </div>

                <h1 className={styles.fullName}>{userData.name}</h1>
                
                <div className={styles.metaInfo}>
                    <span className={styles.topReviewer}>Топ обозреватель</span>
                    <span className={styles.dot}>•</span>
                    <span className={styles.location}>
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                        {userData.location}
                    </span>
                </div>

                <p className={styles.bio}>
                    {userData.bio}
                </p>

                <SubscribeButton userId={id} initialIsFollowing={userData.is_following} session={session} />

                <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{userData.stats.posts}</span>
                        <span className={styles.statLabel}>Публикации</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{userData.stats.followers}</span>
                        <span className={styles.statLabel}>Подписчики</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{userData.stats.following}</span>
                        <span className={styles.statLabel}>Подписки</span>
                    </div>
                </div>
            </section>

            <div className={styles.tabsContainer}>
                <div className={styles.tabActive} style={{ cursor: 'default' }}>
                    Публикации
                </div>
            </div>

            <main className={styles.postsGrid}>
                {posts.length > 0 ? posts.map((dish: any) => (
                    <Link key={dish.id} href={`/dish/${dish.id}`} className={styles.gridItem}>
                        <Image 
                            src={dish.imageUrl} 
                            alt={dish.title || "Post"} 
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                        />
                        <div className={styles.postRating}>
                            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                            <span>{Math.round(dish.userRating || 0)}</span>
                        </div>
                    </Link>
                )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                        <p>У пользователя пока нет постов.</p>
                    </div>
                )}
            </main>
        </>
    );
}
