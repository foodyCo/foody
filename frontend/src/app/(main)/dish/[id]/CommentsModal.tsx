"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { getDishComments, createComment, getCurrentUserAvatar } from "@/app/actions/social";
import { useSession } from "next-auth/react";

interface Comment {
    id: number;
    text: string;
    created_at: string;
    user: number;
    user_detail?: {
        id: number;
        username: string;
        avatar?: string;
    };
}

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dishId: string;
}

export default function CommentsModal({ isOpen, onClose, dishId }: CommentsModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newCommentText, setNewCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touchStartY, setTouchStartY] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("/default-avatar.svg");
    const modalRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            fetchComments();
            fetchCurrentUserProfile();
        } else {
            document.body.style.overflow = "";
            setTranslateY(0);
        }
        
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, dishId]);

    const fetchCurrentUserProfile = async () => {
        if (session?.user) {
            try {
                const avatar = await getCurrentUserAvatar();
                if (avatar) {
                    setCurrentUserAvatar(avatar);
                }
            } catch (e) {
                console.error("Failed to fetch user profile", e);
            }
        }
    };

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const data = await getDishComments(dishId);
            if (data && Array.isArray(data)) {
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        if (diff > 0) {
            setTranslateY(diff);
        }
    };

    const handleTouchEnd = () => {
        if (translateY > 100) {
            onClose();
        } else {
            setTranslateY(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await createComment(dishId, newCommentText);
            if (!result.error) {
                setNewCommentText("");
                await fetchComments();
            } else {
                alert("Ошибка при добавлении комментария");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div 
            className={`${styles.commentsModalOverlay} ${isOpen ? styles.open : ''}`}
            onClick={handleBackdropClick}
            style={{ 
                opacity: isOpen ? 1 : 0, 
                pointerEvents: isOpen ? 'auto' : 'none' 
            }}
        >
            <div 
                ref={modalRef}
                className={`${styles.commentsModalContent} ${isOpen ? styles.open : ''}`}
                style={{
                    transform: isOpen 
                        ? `translateY(${translateY}px)` 
                        : 'translateY(100%)',
                    transition: translateY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                }}
            >
                <div 
                    className={styles.dragHandle}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                ></div>
                
                <div className={styles.modalHeaderNav}>
                    <div className={styles.modalHeaderTitle}>
                        Комментарии
                        <span className={styles.commentsCount}>{comments.length}</span>
                    </div>
                    <button className={styles.closeModalBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                        </svg>
                    </button>
                </div>
                
                <div className={styles.commentsList}>
                    {isLoading ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Загрузка...</p>
                    ) : comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className={styles.commentItem}>
                                <Image 
                                    src={comment.user_detail?.avatar ? (comment.user_detail.avatar.startsWith('http') ? comment.user_detail.avatar : `http://localhost:8000${comment.user_detail.avatar}`) : "/default-avatar.svg"} 
                                    className={styles.commentAvatar}
                                    width={36}
                                    height={36}
                                    alt={comment.user_detail?.username || "user"}
                                    unoptimized
                                />
                                <div className={styles.commentBody}>
                                    <div className={styles.commentAuthorRow}>
                                        <div className={styles.commentAuthor}>{comment.user_detail?.username || `User ${comment.user}`}</div>
                                        <div className={styles.commentTime}>
                                            {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                                        </div>
                                    </div>
                                    <div className={styles.commentText}>{comment.text}</div>
                                    <div className={styles.commentActions}>
                                        <button className={styles.commentActionBtn}>Ответить</button>
                                    </div>
                                </div>
                                <div className={styles.commentLike}>
                                    <button className={styles.commentLikeBtn}>
                                        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    </button>
                                    <span className={styles.commentLikeCount}>0</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-main)' }}>Пока нет комментариев</p>
                            <p style={{ fontSize: '14px', marginTop: '8px' }}>Станьте первым, кто поделится мнением!</p>
                        </div>
                    )}
                </div>
                
                <div className={styles.commentInputArea}>
                    {session ? (
                        <>
                            <Image 
                                src={currentUserAvatar} 
                                className={styles.commentAvatar}
                                width={36}
                                height={36}
                                alt="Ваш аватар"
                                unoptimized
                            />
                            <div className={styles.commentInputWrapper}>
                                <input 
                                    type="text" 
                                    disabled={isSubmitting}
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    className={styles.commentInput} 
                                    placeholder="Добавьте комментарий..." 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSubmit(e);
                                        }
                                    }}
                                />
                            </div>
                            <button 
                                className={styles.sendBtn}
                                onClick={handleSubmit}
                                disabled={isSubmitting || !newCommentText.trim()}
                                style={{ opacity: (!newCommentText.trim() || isSubmitting) ? 0.5 : 1 }}
                            >
                                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                            </button>
                        </>
                    ) : (
                        <div style={{ 
                            width: '100%', 
                            textAlign: 'center', 
                            padding: '12px', 
                            background: 'var(--bg-secondary)', 
                            borderRadius: '16px',
                            color: 'var(--text-secondary)'
                        }}>
                            Войдите, чтобы оставить комментарий
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
