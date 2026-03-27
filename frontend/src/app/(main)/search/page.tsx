
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
    const [selectedCategory, setSelectedCategory] = useState<{id: number, name: string} | null>(null);
    const [userCity, setUserCity] = useState<string>("");

    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [recentSearches, setRecentSearches] = useState<{text: string, type: string}[]>([]);

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

        // Загружаем город пользователя для фильтрации
        fetch(`/api/v1/users/me/`, {
            headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.city) setUserCity(data.city); })
            .catch(() => {});
    }, [session?.user?.accessToken]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!searchQuery.trim() && !selectedCategory) {
                setDishes([]);
                return;
            }

            setLoading(true);
            try {
                if (selectedCategory) {
                    // Точный фильтр по категории + городу
                    const results = await getGroupedSearchDishes(undefined, selectedCategory.id, userCity || undefined);
                    setDishes(results || []);
                } else {
                    // Текстовый поиск
                    const results = await getGroupedSearchDishes(searchQuery);
                    setDishes(results || []);
                }
            } catch (error) {
                console.error("Fetch results error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, userCity]);

    const handleCategoryClick = (cat: {id: number, name: string}) => {
        setSelectedCategory(cat);
        setSearchQuery("");
        setIsFocused(false);
    };

    const handleClearCategory = () => {
        setSelectedCategory(null);
        setDishes([]);
    };

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

            {searchQuery.trim() || isFocused ? (
                <div className={styles.searchHeaderContainer}>
                    <header className={styles.searchHeader}>
                        <button 
                            className={styles.headerActionBtn} 
                            onClick={() => {
                                setIsFocused(false);
                                setSearchQuery("");
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
                                onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => {
                                    setTimeout(() => setIsFocused(false), 200);
                                }}
                                onKeyDown={handleKeyDown}
                                autoFocus={isFocused}
                            />
                            
                            {searchQuery && (
                                <button className={styles.clearBtn} onClick={() => setSearchQuery("")}>
                                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                                </button>
                            )}
                        </div>
                    </header>

                    {searchQuery.trim() && (
                        <div className={styles.quickFilters}>
                            <div className={`${styles.filterChip} ${styles.filterChipActive}`}>
                                <svg viewBox="0 0 24 24"><path d="M3 6h18M6 12h12m-9 6h6"></path></svg>
                                Фильтры
                            </div>
                            <div className={styles.filterChip}>⭐ 4+</div>
                            <div className={styles.filterChip}>Рядом (до 2 км)</div>
                            <div className={styles.filterChip}>Открыто сейчас</div>
                            <div className={styles.filterChip}>До 1000 ₽</div>
                        </div>
                    )}
                </div>
            ) : (
                <header className={styles.searchHeaderWithoutFilters}>
                    <button 
                        className={styles.headerActionBtn} 
                        onClick={() => router.back()}
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
                        />
                        
                        <button className={styles.mapBtn}>
                            <svg viewBox="0 0 24 24">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </header>
            )}

            <main className={styles.mainContent}>

                {selectedCategory ? (
                    <>
                        <div className={styles.resultsMeta}>
                            <button onClick={handleClearCategory} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',color:'var(--text-secondary)',padding:0,fontSize:'14px'}}>
                                <svg viewBox="0 0 24 24" style={{width:16,height:16,stroke:'currentColor',fill:'none'}}><path d="M19 12H5m7 7l-7-7 7-7"/></svg>
                                Все категории
                            </button>
                            <h2 className={styles.resultsTitle}>{getEmoji(selectedCategory.name)} {selectedCategory.name}{userCity ? ` · ${userCity}` : ''}</h2>
                            <span className={styles.resultsCount}>{dishes.length} результатов</span>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>Загрузка...</div>
                        ) : dishes.length > 0 ? (
                            <div className={styles.resultsGrid}>
                                {dishes.map((dish) => (
                                    <div key={dish.id} className={styles.resultCard} onClick={() => router.push(`/dish/${dish.id}`)}>
                                        <div className={styles.cardMedia}>
                                            <img src={dish.imageUrl || "https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} alt={dish.title} />
                                            <div className={styles.ratingBadge}>
                                                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                                                <span>{dish.userRating || 0}</span>
                                            </div>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.dishName}>{dish.title}</h3>
                                            <div className={styles.dishPrice}>{dish.price ? `${dish.price} ₽` : "--- ₽"}</div>
                                            <div className={styles.placeMeta}>
                                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                                                {dish.restaurant?.name || "Неизвестно"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
                                Нет постов в этой категории{userCity ? ` в городе ${userCity}` : ''}
                            </div>
                        )}
                    </>
                ) : searchQuery.trim() ? (
                    <>
                        <div className={styles.resultsMeta}>
                            <h2 className={styles.resultsTitle}>Посты</h2>
                            <span className={styles.resultsCount}>{dishes.length} результатов</span>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>Загрузка...</div>
                        ) : dishes.length > 0 ? (
                            <div className={styles.resultsGrid}>
                                {dishes.map((dish) => (
                                    <div key={dish.id} className={styles.resultCard} onClick={() => router.push(`/dish/${dish.id}`)}>
                                        <div className={styles.cardMedia}>
                                            <img src={dish.imageUrl || "https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"} alt={dish.title} />
                                            <div className={styles.ratingBadge}>
                                                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                                                <span>{dish.userRating || 0}</span>
                                            </div>
                                            <button className={`${styles.bookmarkBtn} ${dish.isSaved ? styles.saved : ''}`}>
                                                <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                            </button>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.dishName}>{dish.title}</h3>
                                            <div className={styles.dishPrice}>{dish.price ? `${dish.price} ₽` : "--- ₽"}</div>
                                            <div className={styles.placeMeta}>
                                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
                                                {dish.restaurant?.name || "Неизвестно"} • 1.2 км
                                            </div>
                                            <div className={styles.authorMeta}>
                                                <img src={dish.author?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"} alt="Author" />
                                                <span>{dish.author?.username || "Пользователь"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
                                Ничего не найдено
                            </div>
                        )}
                    </>
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
                                        <div key={cat.id} className={styles.categoryChip} onClick={() => handleCategoryClick(cat)}>
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
                                        <div key={tag.id} className={styles.trendTag} onClick={() => {
                                            setSearchQuery(`#${tag.name}`);
                                            setIsFocused(true);
                                        }}>
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
