import { Dish } from "./data";

const isServer = typeof window === 'undefined';
const API_URL = isServer
    ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Default headers
    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
    };

    // If body is NOT FormData, default to JSON
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Если токен невалиден или просрочен (401 Unauthorized), 
            // можем выбросить специальную ошибку или вернуть null/перенаправить:
            throw new Error("UNAUTHORIZED");
        }
        
        let errorMessage = "Произошла ошибка при запросе";
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (e) {
            // If not JSON
        }
        throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export function fixMediaUrl(url: string | null | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://backend:8000")) {
        return url.replace("http://backend:8000", "http://localhost:8000");
    }
    return url;
}

export function mapDjangoPostToDish(post: any): Dish {
    const stats = post.statistics || {};
    // Считаем средний рейтинг из трех если они есть, иначе 0
    const taste = stats.rating_taste || 0;
    const appearance = stats.rating_appearance || 0;
    const satiety = stats.rating_satiety || 0;
    const userRating = (taste + appearance + satiety) / 3 || 0;

    return {
        id: post.id.toString(),
        type: "user_post",
        title: post.dish_name || "Без названия",
        description: post.description || "",
        imageUrl: fixMediaUrl(post.images?.[0]?.image) || "/placeholder.png",
        images: post.images?.map((img: any) => fixMediaUrl(img.image)).filter(Boolean) || [],
        userRating: parseFloat(userRating.toFixed(1)),
        matchScore: 0,
        author: {
            id: post.user?.id?.toString() || "unknown",
            name: post.user?.full_name || post.user?.username || "Аноним",
            username: post.user?.username || "user",
            avatar: fixMediaUrl(post.user?.avatar) || "",
            bio: post.user?.bio,
        },
        restaurant: {
            id: post.restaurant?.toString() || "unknown",
            name: post.restaurant_name || "Неизвестно",
            location: { lat: 0, lng: 0 },
            address: post.restaurant_address || "",
        },
        stats: {
            likes: stats.likes_count || 0,
            comments: stats.comments_count || 0,
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
        },
        tags: post.tags?.map((t: any) => t.name) || [],
        createdAt: post.created_at,
        isLiked: post.is_liked || false,
        isSaved: post.is_saved || false,
    };
}
