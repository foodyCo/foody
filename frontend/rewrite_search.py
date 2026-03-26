import os

content = """
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTags, getCategories, getGroupedSearchDishes } from "@/app/actions/post";
import RestaurantCard from "@/components/RestaurantCard";
import styles from "./search.module.css";
import { Dish } from "@/lib/data";

const EMOJI_MAP: Record<string, string> = {
    "Бургеры и фастфуд": "🍔",
    "Кофейни": "☕",
    "Шаурма и гирос": "🌯",
    "Завтраки весь день": "🍳",
    "Пицца": "🍕",
    "Ланчи и столовые": "🍲",
    "Азия": "🍜",
    "Суши и роллы": "🍣",
    "Рамен": "🍜",
    "Вок и Паназия": "🥡",
    "Поке и боулы": "🥙",
    "Кофе": "💻",
    "Пекарни и десерты": "🥐",
    "Вечер и Компании": "🥩",
    "Мясо и гриль": "🔥",
    "Кавказ и Грузия": "🥟",
    "Бары и пабы": "🍻",
    "Альтернатива": "🥗",
    "ЗОЖ и Вег": "🌿"
};

const getEmoji = (name: string) => EMOJI_MAP[name] || "🍽️";

export default function Search() {
    const router = useRouter();
    const { data: session } = useSession() as any;
    
    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [recentSearches, setRecentSearches] = useState<{text: string, type: string}[]>([]);
    
    // Search state
    const [loading, setLoading] = useState(false);
    const [dishes, setDishes] = useState<Dish[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("foody_recent_searches");
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)); } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (!session?.user?.accessToken) return;
        
        getCategories(session.user.accessToken).then(res => {
            if (Array.isArray(res)) setCategories(res);
        });
        
        getTags(session.user.accessToken).then(res => {
            if (Array.isArray(res)) setTags(res);
        });
    }, [session?.user?.accessToken]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim()) {
                setDishes([]);
                return;
            }
            
            setLoading(true);
            try {
                // In a real app we might pass accessToken down, but let's use what we have
                const results = await getGroupedSearchDishes(searchQuery);
                setDishes(results || []);
            } catch (error) {
                console.error("Fetch results error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleClearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem("foody_recent_searches");
    };

    const handleRecentClick = (text: string) => {
        setSearchQuery(text);
        setIsFocused(true);
    };
    
    const saveRecentSearch = (text: string) => {
        if (!text.trim()) return;
        let recent = [...recentSearches];
        recent = recent.filter(r => r.text !== text);
        recent.unshift({ text, type: "Запрос" });
        if (recent.length > 5) recent = recent.slice(0, 5);
        setRecentSearches(recent);
        localStorage.setItem("foody_recent_searches", JSON.stringify(recent));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            saveRecentSearch(searchQuery);
            e.currentTarget.blur();
        }
    };
    
    const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);
    const showMoreButton = !showAllCategories && categories.length > 5;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
            <div className={styles.ambientBg}></div>

            <header className={styles.searchHeader} data-focus={isFocused ? "true" : "false"}>
                <button 
                    className={styles.headerActionBtn} 
                    onClick={() => {
                        if (isFocused || searchQuery) {
                            setIsFocused(false);
                            setSearchQuery("");
                        } else {
                            router.back();
                        }
                    }}
                >
                    <svg viewBox="0 0 24 24"><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                </button>

                <div className={styles.omnibox}>
                    <svg className={styles.omniboxIcon} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    
                    <input 
                        type="text" 
                        className={styles.omniboxInput} 
                        placeholder="Найти блюдо, место или человека..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            // delayed blur so clicks on recents register
                            setTimeout(() => setIsFocused(false), 200);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    
                    <button className={styles.mapBtn}>
                        <svg viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </header>

            <main className={styles.mainContent}>
                
                {searchQuery.trim() ? (
                    <section>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Результаты для "{searchQuery}"</h3>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>Загрузка...</div>
                        ) : dishes.length > 0 ? (
                            dishes.map((dish) => (
                                <RestaurantCard key={dish.id} dish={dish} />
                            ))
                        ) : (
                            <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
                                Ничего не найдено
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {recentSearches.length > 0 && (
                            <section>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Недавние</h3>
                                    <span className={styles.sectionAction} onClick={handleClearRecent}>Очистить</span>
                                </div>
                                <div className={styles.recentSearches}>
                                    {recentSearches.map((item, idx) => (
                                        <div key={idx} className={styles.recentItem} onClick={() => handleRecentClick(item.text)}>
                                            <div className={styles.recentIcon}>
                                                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                            </div>
                                            <span className={styles.recentText}>{item.text}</span>
                                            <span className={styles.recentType}>{item.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {categories.length > 0 && (
                            <section>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Категории</h3>
                                </div>
                                <div className={styles.categoriesGrid}>
                                    {visibleCategories.map(cat => (
                                        <div key={cat.id} className={styles.categoryChip} onClick={() => setSearchQuery(cat.name)}>
                                            <span className={styles.categoryEmoji}>{getEmoji(cat.name)}</span>
                                            <span className={styles.categoryText}>{cat.name}</span>
                                        </div>
                                    ))}

                                    {showMoreButton && (
                                        <div className={`${styles.categoryChip} ${styles.showMoreBtn}`} onClick={() => setShowAllCategories(true)}>
                                            <span className={styles.categoryEmoji}>👇</span>
                                            <span className={styles.categoryText}>Показать все</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {tags.length > 0 && (
                            <section>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Популярные теги</h3>
                                </div>
                                <div className={styles.tagsWrapper}>
                                    {tags.slice(0, 15).map(tag => (
                                        <div key={tag.id} className={styles.trendTag} onClick={() => setSearchQuery(tag.name)}>
                                            <span>#</span>{tag.name}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
"""

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'w') as f:
    f.write(content.strip() + "\n")
