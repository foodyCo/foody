"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, toggleSave } from "@/app/actions/social";
import CommentsModal from "./CommentsModal";
import styles from "./page.module.css";

interface Props {
    dishId: string;
    initialLiked: boolean;
    initialSaved: boolean;
    commentsCount: number;
}

export default function DishInteractiveActions({ dishId, initialLiked, initialSaved, commentsCount }: Props) {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const router = useRouter();

    const handleLike = async () => {
        if (isLikeLoading) return;
        setIsLikeLoading(true);
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        
        const res = await toggleLike(dishId);
        if (res?.error) {
            setIsLiked(!newLiked);
            alert("Ошибка при установке лайка"); // Optionally redirect to login if not auth
        }
        setIsLikeLoading(false);
    };

    const handleSave = async () => {
        if (isSaveLoading) return;
        setIsSaveLoading(true);
        const newSaved = !isSaved;
        setIsSaved(newSaved);
        
        const res = await toggleSave(dishId);
        if (res?.error) {
            setIsSaved(!newSaved);
            alert("Ошибка при сохранении");
        }
        setIsSaveLoading(false);
    };

    return (
        <>
            <div className={styles.actionBar}>
                <button 
                    onClick={() => setIsCommentsOpen(true)} 
                    className={`${styles.btn} ${styles.btnSecondary}`}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    {commentsCount || 0}
                </button>
                
                <button 
                    onClick={handleLike} 
                    disabled={isLikeLoading}
                    className={`${styles.btn} ${styles.btnSecondary} ${isLiked ? styles.liked : ''}`}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Лайк
                </button>
                
                <button 
                    onClick={handleSave} 
                    disabled={isSaveLoading}
                    className={`${styles.btn} ${styles.btnPrimary} ${isSaved ? styles.saved : ''}`}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Сохранить
                </button>
            </div>

            <CommentsModal 
                isOpen={isCommentsOpen} 
                onClose={() => setIsCommentsOpen(false)} 
                dishId={dishId} 
            />
        </>
    );
}
