"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Dish } from "@/lib/data";
import ImageCarousel from "./ImageCarousel";
import { toggleLike, toggleSave } from "@/app/actions/social";
import styles from "./FeedItem.module.css";

interface FeedItemProps {
    dish: Dish;
    initialIsLiked?: boolean;
    initialIsSubscribed?: boolean;
    initialIsSaved?: boolean;
    communityRating?: number;
}

const FeedItem = ({ dish, initialIsLiked = false, initialIsSaved = false, initialIsSubscribed = false, communityRating }: FeedItemProps) => {
    const [isLiked, setIsLiked] = useState(initialIsLiked || dish.isLiked);
    const [isSaved, setIsSaved] = useState(initialIsSaved || dish.isSaved);
    const [likesCount, setLikesCount] = useState(dish.stats?.likes || 0);

    const { data: session } = useSession();
    const router = useRouter();

    const images = dish.images && dish.images.length > 0 ? dish.images : [dish.imageUrl];

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            router.push("/login");
            return;
        }

        const newIsLiked = !isLiked;
        // Optimistic update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        const res = await toggleLike(dish.id);
        if (res?.error) {
            // Revert
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            router.push("/login");
            return;
        }

        const newIsSaved = !isSaved;
        // Optimistic update
        setIsSaved(newIsSaved);

        const res = await toggleSave(dish.id);
        if (res?.error) {
            // Revert
            setIsSaved(!newIsSaved);
        }
    };

    return (
        <article className={styles.dishCard}>
            <div className={styles.postHeader}>
                <Link href={dish.author?.id === session?.user?.id ? "/profile" : `/users/${dish.author?.id}`} className={styles.postAuthor}>
                    <div className={styles.authorAvatar}>
                        <Image
                            src={dish.author?.avatar || "/default-avatar.svg"}
                            alt={dish.author?.name || "User"}
                            fill
                            sizes="36px"
                            className={styles.avatar}
                        />
                    </div>
                    <div className={styles.authorInfo}>
                        <div className={styles.authorName}>{dish.author?.name || "Unknown User"}</div>
                        <div className={styles.authorUsername}>@{dish.author?.username || dish.author?.name?.toLowerCase().replace(/\s+/g, '') || "user"}</div>
                    </div>
                </Link>
                <button className={styles.moreBtn}>
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                </button>
            </div>
            
            <Link href={`/dish/${dish.id}`} className={styles.cardMedia}>
                <ImageCarousel images={images} alt={dish.title} />
            </Link>
            
            <div className={styles.cardContent}>
                <div className={styles.postActionsBottom}>
                    <div className={styles.engagementStats}>
                        <button className={`${styles.stat} ${isLiked ? styles.statLiked : ''}`} onClick={handleLike}>
                            <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            {likesCount}
                        </button>
                        <Link href={`/dish/${dish.id}#comments`} className={styles.stat}>
                            <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            {dish.stats?.comments || 0}
                        </Link>
                    </div>
                    <button className={`${styles.favoriteBtn} ${isSaved ? styles.favoriteBtnActive : ''}`} onClick={handleSave}>
                        <svg viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                </div>

                <div onClick={(e) => {
                    // Prevent navigation if clicked on restaurant link inside
                    if ((e.target as HTMLElement).closest('a')) return;
                    router.push(`/dish/${dish.id}`);
                }} className={styles.cardHeader} style={{ marginTop: '12px', cursor: 'pointer' }}>
                    <div className={styles.dishInfo}>
                        <h2 className={styles.dishName}>{dish.title}</h2>
                        {dish.restaurant?.id ? (
                            <Link href={`/restaurant/${dish.restaurant.id}`} className={styles.restaurantMeta}>
                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                                {dish.restaurant.name} {dish.restaurant.address ? `· ${dish.restaurant.address}` : ""}
                            </Link>
                        ) : (
                            <div className={styles.restaurantMeta}>
                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                                {dish.restaurant?.name || "Неизвестно"} {dish.restaurant?.address ? `· ${dish.restaurant.address}` : ""}
                            </div>
                        )}
                    </div>
                    <div className={styles.dishPrice}>{dish.price ? `${dish.price} ₽` : ""}</div>
                </div>
                
                <p className={styles.postDescription}>
                    <Link href={dish.author?.id === session?.user?.id ? "/profile" : `/users/${dish.author?.id}`}>
                        {dish.author?.username || dish.author?.name?.toLowerCase().replace(/\s+/g, '') || "user"}
                    </Link> {dish.description || ""}
                </p>
            </div>
        </article>
    );
};

export default FeedItem;
