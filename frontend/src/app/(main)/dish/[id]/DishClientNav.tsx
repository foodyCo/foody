"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePost } from "@/app/actions/post";
import styles from "./page.module.css";

export default function DishClientNav({ isOwner, postId }: { isOwner?: boolean, postId?: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBack = () => {
        // Всегда возвращаемся на главную ленту, чтобы избежать зацикливания с комментариями
        router.push('/');
    };

    const handleDelete = async () => {
        if (!postId) return;
        const confirmDelete = window.confirm("Вы точно хотите удалить этот пост?");
        if (!confirmDelete) return;

        setIsDeleting(true);
        const result = await deletePost(postId);
        if (result?.error) {
            alert(result.error);
            setIsDeleting(false);
        } else {
            router.push('/');
        }
    };

    return (
        <div className={styles.galleryControls}>
            <button onClick={handleBack} className={styles.controlBtn}>
                <svg viewBox="0 0 24 24">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            
            <div style={{ display: 'flex', gap: '8px' }}>
                {isOwner && (
                    <button 
                        className={styles.controlBtn} 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Удалить пост"
                    >
                        {isDeleting ? (
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>...</span>
                        ) : (
                            <svg viewBox="0 0 24 24" style={{ stroke: '#e74c3c' }}>
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6L17.5 20.5A2 2 0 0 1 15.5 22h-7A2 2 0 0 1 6.5 20.5L5 6m5 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        )}
                    </button>
                )}
                <button className={styles.controlBtn} title="Поделиться">
                    <svg viewBox="0 0 24 24">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
