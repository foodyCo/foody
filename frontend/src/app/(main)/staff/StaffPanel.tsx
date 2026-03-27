"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiRequest } from "@/lib/api";
import styles from "./staff.module.css";

interface PendingPost {
    id: number;
    title: string;
    author: string;
    authorId: number | null;
    image: string | null;
    allImages: string[];
    createdAt: string;
    description: string;
    price: string | null;
    restaurant: string;
    tags: string[];
    rating: number;
}

interface Category {
    id: number;
    name: string;
}

export default function StaffPanel({
    pendingPosts: initialPosts,
    categories: initialCategories,
    accessToken,
}: {
    pendingPosts: PendingPost[];
    categories: Category[];
    accessToken: string;
}) {
    const router = useRouter();
    const [posts, setPosts] = useState(initialPosts);
    const [categories, setCategories] = useState(initialCategories);
    const [newCategory, setNewCategory] = useState("");
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const authHeader = { "Authorization": `Bearer ${accessToken}` } as Record<string, string>;

    async function handleApprove(id: number) {
        try {
            await apiRequest(`/moderation/${id}/approve/`, {
                method: "POST",
                headers: authHeader,
            });
            setPosts(prev => prev.filter(p => p.id !== id));
            setSelectedPost(null);
        } catch {}
    }

    async function handleReject(id: number) {
        const reason = prompt("Причина отклонения (необязательно):");
        try {
            await apiRequest(`/moderation/${id}/reject/`, {
                method: "POST",
                headers: authHeader,
                body: JSON.stringify({ rejection_reason: reason || "" }),
            });
            setPosts(prev => prev.filter(p => p.id !== id));
            setSelectedPost(null);
        } catch {}
    }

    async function handleAddCategory() {
        const name = newCategory.trim();
        if (!name) return;
        setIsAddingCategory(true);
        setCategoryError(null);
        try {
            const created = await apiRequest("/categories/", {
                method: "POST",
                headers: authHeader,
                body: JSON.stringify({ name }),
            });
            setCategories(prev => [...prev, created]);
            setNewCategory("");
        } catch (e: any) {
            setCategoryError(e.message || "Ошибка");
        } finally {
            setIsAddingCategory(false);
        }
    }

    async function handleDeleteCategory(id: number) {
        if (!confirm("Удалить категорию?")) return;
        try {
            await apiRequest(`/categories/${id}/`, {
                method: "DELETE",
                headers: authHeader,
            });
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch {}
    }

    function openPost(post: PendingPost) {
        setSelectedPost(post);
        setCurrentImageIndex(0);
    }

    return (
        <>
            <div className={styles.ambientBg}></div>

            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
                </button>
                <h1 className={styles.headerTitle}>Панель модератора</h1>
            </header>

            <main className={styles.main}>

                <span className={styles.sectionLabel}>На модерации ({posts.length})</span>
                {posts.length === 0 ? (
                    <div className={styles.emptyState}>Нет постов для проверки</div>
                ) : (
                    <div className={styles.postList}>
                        {posts.map(post => (
                            <div
                                key={post.id}
                                className={styles.postCard}
                                onClick={() => openPost(post)}
                                style={{ cursor: "pointer" }}
                            >
                                {post.image && (
                                    <div className={styles.postThumb}>
                                        <Image src={post.image} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="64px" />
                                    </div>
                                )}
                                <div className={styles.postInfo}>
                                    <span className={styles.postTitle}>{post.title}</span>
                                    <span className={styles.postAuthor}>@{post.author}</span>
                                    {post.restaurant && (
                                        <span className={styles.postAuthor} style={{ color: 'var(--text-tertiary)' }}>{post.restaurant}</span>
                                    )}
                                </div>
                                <div className={styles.postActions}>
                                    <button
                                        className={styles.approveBtn}
                                        onClick={e => { e.stopPropagation(); handleApprove(post.id); }}
                                    >
                                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                                    </button>
                                    <button
                                        className={styles.rejectBtn}
                                        onClick={e => { e.stopPropagation(); handleReject(post.id); }}
                                    >
                                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <span className={styles.sectionLabel} style={{ marginTop: 32 }}>Категории</span>
                <div className={styles.categoryAddRow}>
                    <input
                        className={styles.categoryInput}
                        type="text"
                        placeholder="Новая категория..."
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                    />
                    <button className={styles.addBtn} onClick={handleAddCategory} disabled={isAddingCategory || !newCategory.trim()}>
                        Добавить
                    </button>
                </div>
                {categoryError && <div className={styles.categoryError}>{categoryError}</div>}

                <div className={styles.categoryList}>
                    {categories.map(cat => (
                        <div key={cat.id} className={styles.categoryItem}>
                            <span className={styles.categoryName}>{cat.name}</span>
                            <button className={styles.deleteBtn} onClick={() => handleDeleteCategory(cat.id)}>
                                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>

            </main>

            {/* Post detail modal */}
            {selectedPost && (
                <div className={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.modalCloseBtn} onClick={() => setSelectedPost(null)}>
                            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                        </button>

                        {selectedPost.allImages.length > 0 && (
                            <div className={styles.modalImageWrap}>
                                <Image
                                    src={selectedPost.allImages[currentImageIndex]}
                                    alt={selectedPost.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="600px"
                                />
                                {selectedPost.allImages.length > 1 && (
                                    <div className={styles.imageDots}>
                                        {selectedPost.allImages.map((_, i) => (
                                            <button
                                                key={i}
                                                className={`${styles.imageDot} ${i === currentImageIndex ? styles.imageDotActive : ''}`}
                                                onClick={() => setCurrentImageIndex(i)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.modalBody}>
                            <div className={styles.modalTitleRow}>
                                <h2 className={styles.modalTitle}>{selectedPost.title}</h2>
                                {selectedPost.price && <span className={styles.modalPrice}>{selectedPost.price}</span>}
                            </div>

                            <div className={styles.modalMeta}>
                                <span>@{selectedPost.author}</span>
                                {selectedPost.restaurant && <span>· {selectedPost.restaurant}</span>}
                                {selectedPost.rating > 0 && <span>· ★ {selectedPost.rating.toFixed(1)}</span>}
                            </div>

                            {selectedPost.description && (
                                <p className={styles.modalDescription}>{selectedPost.description}</p>
                            )}

                            {selectedPost.tags.length > 0 && (
                                <div className={styles.modalTags}>
                                    {selectedPost.tags.map(t => (
                                        <span key={t} className={styles.modalTag}>#{t}</span>
                                    ))}
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button
                                    className={styles.modalRejectBtn}
                                    onClick={() => handleReject(selectedPost.id)}
                                >
                                    Отклонить
                                </button>
                                <button
                                    className={styles.modalApproveBtn}
                                    onClick={() => handleApprove(selectedPost.id)}
                                >
                                    Одобрить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
