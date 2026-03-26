"use client";

import { useState, useMemo, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import RestaurantCard from "@/components/RestaurantCard";
import { getGroupedSearchDishes } from "@/app/actions/post";
import { CATEGORIES, Dish } from "@/lib/data";

export default function Search() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Все");
    const [dishes, setDishes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const results = await getGroupedSearchDishes(searchQuery, activeCategory);
                setDishes(results);
            } catch (error) {
                console.error("Fetch results error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300); // Debounce
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory]);

    return (
        <div style={{ padding: "16px", paddingBottom: "80px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "16px" }}>Поиск</h1>

            <div style={{ marginBottom: "16px" }}>
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <div style={{ marginBottom: "24px" }}>
                <CategoryFilter
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            <div className="results">
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
                    {searchQuery ? `Результаты для "${searchQuery}"` : "Популярное"}
                </h2>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>Загрузка...</div>
                ) : dishes.length > 0 ? (
                    dishes.map((dish: Dish) => (
                        <RestaurantCard key={dish.id} dish={dish} />
                    ))
                ) : (
                    <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>
                        Ничего не найдено
                    </div>
                )}
            </div>
        </div>
    );
}
