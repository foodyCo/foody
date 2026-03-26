import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'r') as f:
    orig = f.read()

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
"""

idx = orig.find("    return (")
if idx != -1:
    with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'w') as f:
        f.write(content + "\n" + orig[idx:])
else:
    print("could not find return")
