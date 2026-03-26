import { auth } from "@/auth";
import { getGroupedDishDetails } from "@/app/actions/post";
import Image from "next/image";
import Link from "next/link";
import { apiRequest, mapDjangoPostToDish } from "@/lib/api";
import ImageCarousel from "@/components/ImageCarousel";
import styles from "./page.module.css";
import DishClientNav from "./DishClientNav";
import DishInteractiveActions from "./DishInteractiveActions";

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isGrouped = id.startsWith("grouped_");
    const session = await auth() as any;

    let dish: any = null;
    let groupedData: any = null;

    try {
        if (isGrouped) {
            const decodedId = decodeURIComponent(id);
            const parts = decodedId.split(":::");
            const titlePart = parts[0]; 
            const title = titlePart.replace("grouped_", "");
            const restaurantName = parts[1];
            groupedData = await getGroupedDishDetails(title, restaurantName);

            if (groupedData) {
                dish = {
                    id,
                    title: groupedData.title,
                    restaurant: {
                        name: groupedData.restaurantName,
                        address: groupedData.restaurantAddress || "Адрес не указан"
                    },
                    stats: groupedData.stats,
                    userRating: groupedData.weightedRating,
                    reviewCount: groupedData.reviewCount,
                    images: groupedData.images,
                    tags: groupedData.tags || [],
                    matchScore: 95
                };
            }
        } else {
            const options: any = {};
            if (session?.user?.accessToken) {
                options.headers = {
                    "Authorization": `Bearer ${session.user.accessToken}`
                };
            }
            
            const rawPost = await apiRequest(`/posts/${id}/`, options);
            if (rawPost) {
                dish = mapDjangoPostToDish(rawPost);
                dish.isLiked = rawPost.is_liked;
                dish.isSaved = rawPost.is_saved;
                dish.createdAt = rawPost.created_at;
                dish.commentsCount = rawPost.statistics?.comments_count || 0;
            }
        }

        if (!dish) {
            return <div className={styles.detailView} style={{ padding: "40px", textAlign: "center" }}>Блюдо не найдено</div>;
        }

        const isOwner = !isGrouped && dish.author && (session?.user?.id?.toString() === dish.author.id?.toString());
        const coverImage = dish.images && dish.images.length > 0 ? dish.images[0] : (dish.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC9rHiZZ7tsfvGFV-jW-p8oo7TfjBnvVw7HiUJ2hqMhq0mgcumNWea_rQ4WRtgnISo5K4kTdV2i-16bZ3oAWJRYvUJP4WQZTy-hklnZABjCerT48SIwlItJJX3p8zxN70mbgYXxyasXxrMES8-InS-JwbTFNQSi7uMg0fkwgqmdVi2TBYPao-UTL-3LitJICV8pj0kNCs-geDjwePSmttIzUNA6Y7Op7k6e892Fq_zPPn4Alm_4z2Sf8194dizWklMCCDmqYNJVZI5L");

        let authorName = dish.author?.name || "Пользователь";
        let authorAvatar = dish.author?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuAl6WeY6gSU4Ki2VjPZrCbf-HeVJHZBukV5ZzUPAAEmRnbPpazswUp9FOFDwuhDlQzLuudpPn2eEuU5a370vZlOql-a4JGu85Ng_UaVcScMEDCbOQycHg9iZ0-j_buiAWyk2AomwQTB_0HvFySAsaPlvwBAdFB-PC9qA1HSqw8922183zckYM9VBS6q_BMPBrf4xUrc30Mxat3awfVqWJZ2BH0s8RtEhq3upQdfNiAH1KbSQTooOE1qNDC_BJhnPP7bi8DywmjF-r2j";
        
        let dateString = "Недавно";
        if (dish.createdAt) {
            dateString = new Date(dish.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        } else if (groupedData) {
            dateString = "Сводный рейтинг";
            authorName = "Foody AI";
        }

        // We use first 3 tags max to avoid clutter
        const displayTags = dish.tags && dish.tags.length > 0 ? dish.tags.slice(0, 3) : ["блюдо"];
        const ratingScore = Number(dish.userRating || 0).toFixed(1);
        const images = dish.images && dish.images.length > 0 ? dish.images.map((img: any) => typeof img === 'string' ? img : (img.image || img.url)) : (dish.imageUrl ? [dish.imageUrl] : ["https://lh3.googleusercontent.com/aida-public/AB6AXuC9rHiZZ7tsfvGFV-jW-p8oo7TfjBnvVw7HiUJ2hqMhq0mgcumNWea_rQ4WRtgnISo5K4kTdV2i-16bZ3oAWJRYvUJP4WQZTy-hklnZABjCerT48SIwlItJJX3p8zxN70mbgYXxyasXxrMES8-InS-JwbTFNQSi7uMg0fkwgqmdVi2TBYPao-UTL-3LitJICV8pj0kNCs-geDjwePSmttIzUNA6Y7Op7k6e892Fq_zPPn4Alm_4z2Sf8194dizWklMCCDmqYNJVZI5L"]);

        return (
            <>
                <div className={styles.ambientBg}></div>
                <div className={styles.detailView}>
                    
                    <div className={styles.galleryContainer}>
                        <DishClientNav isOwner={isOwner} postId={dish.id} />
                        
                        <ImageCarousel images={images} alt={dish.title} isFullScreen={true} />
                    </div>

                    <div className={styles.detailCard}>
                        <div className={styles.headerRow}>
                            <h1 className={styles.dishTitle}>{dish.title}</h1>
                            {/* Dummy price conceptually kept, but maybe should just be hidden if unavailable. For now matching design. */}
                            <div className={styles.priceTag}>~ 550 ₽</div>
                        </div>

                        <div className={styles.overallRating}>
                            <div className={styles.ratingStars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg 
                                        key={star} 
                                        className={`${styles.star} ${star <= Math.round(Number(dish.userRating || 0)) ? styles.filled : ''}`} 
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                ))}
                            </div>
                            <span className={styles.ratingScore}>{ratingScore}</span>
                        </div>

                        {displayTags.length > 0 && (
                            <div className={styles.tagsRow}>
                                {displayTags.map((tag: string) => (
                                    <span key={tag} className={styles.postTagPill}>#{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className={styles.locationSection}>
                            <div className={styles.locationInfo}>
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <div>
                                    <div className={styles.restaurantName}>{dish.restaurant?.name || "Неизвестный ресторан"}</div>
                                    <div className={styles.restaurantAddress}>{dish.restaurant?.address || "Адрес не указан"}</div>
                                </div>
                            </div>
                        </div>

                        <p className={styles.dishDescription}>
                            {dish.description || "Описание для этого блюда пока не добавлено. Попробуйте это восхитительное блюдо и станьте первым, кто его опишет!"}
                        </p>

                        <Link href={`/users/${dish.author?.id || ''}`} style={{ textDecoration: 'none', display: 'block' }}>
                            <div className={styles.userProfile}>
                                <div className={styles.userAvatar}>
                                    <Image src={authorAvatar} alt={authorName} fill style={{objectFit: 'cover'}} />
                                </div>
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{authorName}</div>
                                    <div className={styles.userStatus}>Гурман</div>
                                </div>
                                <div className={styles.postDate}>{dateString}</div>
                            </div>
                        </Link>
                    </div>

                    <DishInteractiveActions 
                        dishId={dish.id} 
                        initialLiked={dish.isLiked} 
                        initialSaved={dish.isSaved} 
                        commentsCount={dish.commentsCount} 
                    />

                </div>
            </>
        );
    } catch (error) {
        console.error("Dish page load error:", error);
        return <div className={styles.detailView} style={{ padding: "40px", textAlign: "center" }}>Ошибка при загрузке данных блюда</div>;
    }
}
