"use client";

import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/app/actions/social";
import { deletePost } from "@/app/actions/post";
import styles from "./DishActions.module.css";
import { Trash2 } from "lucide-react";

interface DishActionsProps {
    dishId: string;
    isAuthor?: boolean;
    initialIsLiked?: boolean;
}

export default function DishActions({ dishId, isAuthor, initialIsLiked = false }: DishActionsProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const { data: session } = useSession();
    const router = useRouter();

    const handleLike = async () => {
        if (!session) {
            router.push("/login");
            return;
        }

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);

        const res = await toggleLike(dishId);
        if (res?.error) {
            setIsLiked(!newIsLiked);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Foody Dish',
                url: window.location.href,
            });
        }
    };

    const handleDelete = async () => {
        if (confirm("Вы уверены, что хотите удалить этот пост?")) {
            const res = await deletePost(dishId);
            if (res?.success) {
                router.push("/profile");
            } else {
                alert("Ошибка при удалении");
            }
        }
    };

    return (
        <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button className={styles.actionBtn} onClick={handleShare}>
                <Share2 size={24} />
            </button>
            {isAuthor && (
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete} style={{ color: '#e74c3c' }}>
                    <Trash2 size={24} />
                </button>
            )}
        </div>
    );
}
