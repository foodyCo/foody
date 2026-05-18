"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { apiRequest, mapDjangoPostToDish } from "@/lib/api";


export async function createPost(formData: FormData) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Необходимо войти в систему" };
    }

    const title = formData.get("title") as string;
    const rawDescription = formData.get("description") as string;
    const description = rawDescription?.trim() ? rawDescription : "Без описания";
    const taste = formData.get("userRating") as string; // Используем как базу для вкуса
    
    // В Django нам нужно 3 оценки. Фронтенд пока дает одну.
    // Пробросим одну и ту же во все три для начала, или предложим дефолты.
    const ratingValue = parseFloat(taste) || 0;
    // Backend stores rating 0-10, form uses 0-5 stars — multiply to convert
    const ratingBackend = Math.min(ratingValue * 2, 10);

    const newFormData = new FormData();
    newFormData.append("dish_name", title);
    newFormData.append("description", description);
    newFormData.append("rating", ratingBackend.toString());
    
    // Add price if it exists
    const priceStr = formData.get("price") as string;
    const priceValue = parseFloat(priceStr);
    if (!isNaN(priceValue)) {
        newFormData.append("price", priceValue.toFixed(2));
    }
    
    const restName = (formData.get("restaurantName") as string)?.trim() || "Неизвестно";
    newFormData.append("restaurant_name", restName);
    
    const restAddress = (formData.get("restaurantAddress") as string)?.trim();
    if (restAddress) {
        newFormData.append("restaurant_address", restAddress);
    }
    
    const category = formData.get("category") as string;
    if (category) {
        newFormData.append("tags_list", category);
    }

    // Обработка тегов
    const tags = formData.getAll("tags") as string[];
    tags.forEach(tag => newFormData.append("tags_list", tag));

    // Обработка изображений
    const files = formData.getAll("image") as File[];
    files.forEach(file => {
        if (file.size > 0) {
            newFormData.append("uploaded_images", file);
        }
    });

    try {
        await apiRequest("/posts/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`
            },
            body: newFormData as any
        });

        revalidatePath("/");
        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Create post error:", error);
        return { error: error.message || "Ошибка при создании поста" };
    }
}

export async function deletePost(postId: string) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    try {
        await apiRequest(`/posts/${postId}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`
            }
        });

        revalidatePath("/profile");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Delete post error:", error);
        return { error: error.message || "Failed to delete post" };
    }
}

export async function createComment(postId: string, text: string) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }

    try {
        const response = await apiRequest(`/posts/${postId}/comments/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        revalidatePath(`/dish/${postId}`);
        revalidatePath(`/dish/${postId}/comments`);
        return { success: true, data: response };
    } catch (error: any) {
        console.error("Create comment error:", error);
        return { error: error.message || "Failed to add comment" };
    }
}

export async function deleteComment(postId: string, commentId: number | string) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) {
        return { error: "Unauthorized" };
    }
    try {
        await apiRequest(`/posts/${postId}/comments/${commentId}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`,
            },
        });
        revalidatePath(`/dish/${postId}`);
        revalidatePath(`/dish/${postId}/comments`);
        return { success: true };
    } catch (error: any) {
        console.error("Delete comment error:", error);
        return { error: error.message || "Failed to delete comment" };
    }
}

export async function getSearchPosts(query?: string, category?: string, accessToken?: string) {
    try {
        let endpoint = "/posts/";
        const params = new URLSearchParams();
        
        if (query) {
            params.append("search", query);
        }
        
        const queryString = params.toString();
        if (queryString) {
            endpoint += `?${queryString}`;
        }

        const options: any = {};
        if (accessToken) {
            options.headers = {
                "Authorization": `Bearer ${accessToken}`
            };
        }

        const data = await apiRequest(endpoint, options);
        
        const results = data?.results || data;
        
        if (!Array.isArray(results)) return [];

        return results.map(mapDjangoPostToDish);
    } catch (error: any) {
        console.error("Search error:", error);
        if (error.message === "UNAUTHORIZED") {
            throw error; // Перебрасываем 401 наверх, чтобы страницы могли редиректить
        }
        return [];
    }
}
export async function getFollowingPosts(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) {
            options.headers = {
                "Authorization": `Bearer ${accessToken}`
            };
        }
        
        const response = await apiRequest("/posts/following/", options);
        // Assuming your backend returns paginated results { results: [...] } or just an array
        const results = Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []);
        return results.map(mapDjangoPostToDish);
    } catch (error) {
        console.error("Search following posts error:", error);
        return [];
    }
}

export async function getTags(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { "Authorization": `Bearer ${accessToken}` };
        const data = await apiRequest("/tags/", options);
        return data?.results || data || [];
    } catch (error) {
        console.error("Fetch tags error:", error);
        return [];
    }
}

export async function getCategories(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { "Authorization": `Bearer ${accessToken}` };
        const data = await apiRequest("/categories/", options);
        return data?.results || data || [];
    } catch (error) {
        console.error("Fetch categories error:", error);
        return [];
    }
}

export async function getRestaurant(restaurantId: string | number, accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { 'Authorization': `Bearer ${accessToken}` };
        return await apiRequest(`/restaurants/${restaurantId}/`, options);
    } catch {
        return null;
    }
}

export async function getRestaurantPosts(restaurantId: string | number, accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { 'Authorization': `Bearer ${accessToken}` };
        return await apiRequest(`/posts/?restaurant_id=${restaurantId}`, options);
    } catch {
        return { results: [] };
    }
}
