import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiRequest, mapDjangoPostToDish, fixMediaUrl } from "@/lib/api";
import styles from "./profile.module.css";

export default async function Profile({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const activeTab = tab || "posts";
    const session = await auth() as any;

    if (!session?.user?.accessToken) {
        redirect("/login");
    }

    let posts = [];
    let savedPosts = [];
    let userProfile = null;
    let postsCount = 0;
    try {
        const [postsData, savedData, userData] = await Promise.all([
            apiRequest("/posts/my/", {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            }),
            apiRequest("/posts/saved/", {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            }),
            apiRequest("/users/me/", {
                headers: { "Authorization": `Bearer ${session.user.accessToken}` }
            }).catch(() => null)
        ]);
        
        posts = Array.isArray(postsData?.results || postsData) 
            ? (postsData?.results || postsData).map(mapDjangoPostToDish) 
            : [];
            
        postsCount = postsData?.count || posts.length;

        savedPosts = Array.isArray(savedData?.results || savedData) 
            ? (savedData?.results || savedData).map(mapDjangoPostToDish) 
            : [];
            
        userProfile = userData;
    } catch (e: any) {
        console.error("Failed to load profile data", e);
        if (e.message === "UNAUTHORIZED") {
            redirect("/api/auth/signin"); // или "/login"
        }
    }

    const defaultAvatar = "/default-avatar.svg";
    
        // Fallbacks just in case
    const mappedUser = {
        name: userProfile?.full_name || userProfile?.username || session.user.name || "Пользователь",
        handle: userProfile?.username || session.user.name?.toLowerCase().replace(/\s+/g, '_') || "user",
        avatar: fixMediaUrl(userProfile?.avatar) || session.user.image || defaultAvatar,
        bio: userProfile?.bio_text || "Здесь пока нет описания профиля...",
        location: userProfile?.city || "Ростов-на-Дону", 
        stats: {
            posts: userProfile?.posts_count ?? postsCount,
            followers: userProfile?.followers_count ?? 0, 
            following: userProfile?.following_count ?? 0
        }
    };

    return (
        <>
            <div className={styles.ambientBg}></div>

            <header className={styles.profileHeaderTop}>
                <div className={styles.username}>@{mappedUser.handle}</div>
                <Link href="/settings" className={styles.settingsBtn}>
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </Link>
            </header>

            <section className={styles.profileInfo}>
                <div className={styles.avatarContainer}>
                    <Image 
                        src={mappedUser.avatar} 
                        alt={mappedUser.name} 
                        className={styles.avatar} 
                        width={90} 
                        height={90} 
                    />
                    <div className={styles.verifiedBadge}>
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                    </div>
                </div>

                <h1 className={styles.fullName}>{mappedUser.name}</h1>
                
                <div className={styles.metaInfo}>
                    <span className={styles.topReviewer}>Лучший критик</span>
                    <span className={styles.dot}>•</span>
                    <span className={styles.location}>
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                        {mappedUser.location}
                    </span>
                </div>

                <p className={styles.bio}>
                    {mappedUser.bio}
                </p>

                <Link href="/profile/edit" className={styles.editProfileBtn}>
                    Редактировать профиль
                </Link>

                <div className={styles.statsContainer}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{mappedUser.stats.posts}</span>
                        <span className={styles.statLabel}>Посты</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{mappedUser.stats.followers}</span>
                        <span className={styles.statLabel}>Подписчики</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{mappedUser.stats.following}</span>
                        <span className={styles.statLabel}>Подписки</span>
                    </div>
                </div>
            </section>

            <div className={styles.tabsContainer}>
                <Link href="?tab=posts" className={activeTab === 'posts' ? styles.tabActive : styles.tab}>
                    Посты
                </Link>
                <Link href="?tab=saved" className={activeTab === 'saved' ? styles.tabActive : styles.tab}>
                    Сохраненное
                </Link>
            </div>

            <main className={styles.postsGrid}>
                {activeTab === "posts" ? (
                    posts.length > 0 ? posts.map((dish: any) => (
                        <Link key={dish.id} href={`/dish/${dish.id}`} className={styles.gridItem}>
                            <Image 
                                src={dish.imageUrl} 
                                alt={dish.title || "Post"} 
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                            {dish.status === 'pending' && <div className={styles.pendingOverlay} />}
                            {dish.status === 'pending' && <div className={styles.pendingBadge}>На модерации</div>}
                            {dish.status === 'rejected' && <div className={styles.rejectedOverlay} />}
                            {dish.status === 'rejected' && <div className={styles.rejectedBadge}>Отклонен</div>}
                            <div className={styles.postRating}>
                                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                                <span>{Math.round(dish.userRating || 0)}</span>
                            </div>
                        </Link>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                            <p>У вас пока нет постов.</p>
                        </div>
                    )
                ) : (
                    savedPosts.length > 0 ? savedPosts.map((dish: any) => (
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
                            <p>Тут будут ваши сохраненные посты.</p>
                        </div>
                    )
                )}
            </main>
        </>
    );
}
