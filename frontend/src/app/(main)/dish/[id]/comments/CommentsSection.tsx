"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createComment } from '@/app/actions/post';

interface CommentType {
    id: number;
    user: {
        id: number;
        username: string;
        image?: string;
    };
    text: string;
    created_at: string;
    likes: number;
    isLiked?: boolean;
}

export default function CommentsSection({ 
    postId, 
    initialComments, 
    myAvatar,
    isAuthenticated,
    accentRedirect
}: { 
    postId: string;
    initialComments: CommentType[];
    myAvatar: string;
    isAuthenticated: boolean;
    accentRedirect: string;
}) {
    const router = useRouter();
    const [comments, setComments] = useState<CommentType[]>(initialComments);
    const [newText, setNewText] = useState("");
    const sheetRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || !isAuthenticated) return;
        
        // Optimistic UI update
        const newOb: CommentType = {
            id: Date.now(),
            user: { id: 0, username: "Вы", image: myAvatar },
            text: newText,
            created_at: "Только что",
            likes: 0
        };
        setComments(prev => [...prev, newOb]);
        setNewText('');
        if (inputRef.current) inputRef.current.blur();
        
        try {
            await createComment(postId, newText);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClose = () => {
        if (sheetRef.current) {
            sheetRef.current.style.transform = 'translateY(100%)';
            setTimeout(() => {
                router.push(accentRedirect);
            }, 300);
        }
    };

    // Animate in on mount
    useEffect(() => {
        if (sheetRef.current) {
            sheetRef.current.style.transform = 'translateY(0)';
        }
    }, []);

    // Also support drag to dismiss
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);

    const onTouchStart = (e: React.TouchEvent) => setStartY(e.touches[0].clientY);
    const onTouchMove = (e: React.TouchEvent) => {
        const delta = e.touches[0].clientY - startY;
        if (delta > 0) {
            setCurrentY(delta);
            if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
        }
    };
    const onTouchEnd = () => {
        if (currentY > 150) {
            handleClose();
        } else {
            setCurrentY(0);
            if (sheetRef.current) sheetRef.current.style.transform = 'translateY(0)';
        }
    };

    return (
        <div 
            className={styles.bottomSheet} 
            ref={sheetRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className={styles.handleBar}>
                <div className={styles.handleLine}></div>
            </div>
            
            <div className={styles.header}>
                <h2 className={styles.title}>Комментарии</h2>
                <span className={styles.count}>{comments.length}</span>
                <button 
                    onClick={handleClose}
                    className={styles.closeBtn}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div className={styles.commentList}>
                {comments.map(c => (
                    <div className={styles.commentItem} key={c.id}>
                        <div className={styles.avatarWrap}>
                            <Image 
                                src={c.user.image || myAvatar}
                                alt={c.user.username}
                                fill
                                className={styles.avatarImg}
                                unoptimized
                            />
                        </div>
                        <div className={styles.commentBody}>
                            <div className={styles.commentHeader}>
                                <Link href={`/users/${c.user.id}`} className={styles.username} style={{ textDecoration: 'none', color: 'inherit' }}>{c.user.username}</Link>
                                <span className={styles.time}>{c.created_at}</span>
                            </div>
                            <p className={styles.commentText}>{c.text}</p>
                            <button className={styles.replyBtn}>Ответить</button>
                        </div>
                        <div className={styles.likes}>
                            <button className={c.isLiked ? styles.likedIcon : styles.likeIcon}>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: `\'FILL\' ${c.isLiked ? 1 : 0}`, fontSize: '18px' }}>
                                    favorite
                                </span>
                            </button>
                            <span>{c.likes}</span>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.inputArea}>
                <div className={styles.inputMe}>
                    <Image 
                        src={myAvatar}
                        alt="My Profile"
                        fill
                        className={styles.avatarImg}
                        unoptimized
                    />
                </div>
                <div className={styles.inputWrap}>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder={isAuthenticated ? "Добавьте комментарий..." : "Войдите, чтобы комментировать"}
                        className={styles.input}
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        disabled={!isAuthenticated}
                    />
                    <button 
                        type="submit" 
                        className={styles.sendBtn}
                        disabled={!newText.trim()}
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
