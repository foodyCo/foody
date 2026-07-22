import { apiRequest } from "@/lib/api";

export type CategoryMode = "dishes" | "cuisines";

export type FoodCategory = {
  id: string;
  label: string;
  emoji: string;
  mode: CategoryMode;
};

const DISH_CATEGORIES: FoodCategory[] = [
  { id: "pizza", label: "Пицца", emoji: "🍕", mode: "dishes" },
  { id: "burgers", label: "Бургеры", emoji: "🍔", mode: "dishes" },
  { id: "sandwiches", label: "Сэндвичи", emoji: "🥪", mode: "dishes" },
  { id: "shawarma", label: "Шаурма", emoji: "🌯", mode: "dishes" },
  { id: "sushi-rolls", label: "Суши и роллы", emoji: "🍣", mode: "dishes" },
  { id: "ramen", label: "Рамен", emoji: "🍜", mode: "dishes" },
  { id: "wok", label: "Вок", emoji: "🥞", mode: "dishes" },
  { id: "pasta", label: "Паста", emoji: "🍝", mode: "dishes" },
  { id: "tacos", label: "Тако", emoji: "🌮", mode: "dishes" },
  { id: "tom-yum", label: "Том-ям", emoji: "🥣", mode: "dishes" },
  { id: "poke", label: "Поке", emoji: "🍚", mode: "dishes" },
  { id: "khachapuri", label: "Хачапури", emoji: "🫓", mode: "dishes" },
  { id: "steaks", label: "Стейки", emoji: "🥩", mode: "dishes" },
  { id: "cheesecake", label: "Чизкейк", emoji: "🍰", mode: "dishes" },
];

const CUISINE_CATEGORIES: FoodCategory[] = [
  { id: "asian", label: "Азиатская", emoji: "🥢", mode: "cuisines" },
  { id: "italian", label: "Итальянская", emoji: "🍝", mode: "cuisines" },
  { id: "russian", label: "Русская", emoji: "🥟", mode: "cuisines" },
  { id: "caucasian", label: "Кавказская", emoji: "🫓", mode: "cuisines" },
  { id: "american", label: "Американская", emoji: "🍔", mode: "cuisines" },
  { id: "middle-eastern", label: "Ближневосточная", emoji: "🧆", mode: "cuisines" },
  { id: "mexican", label: "Мексиканская", emoji: "🌮", mode: "cuisines" },
  { id: "french", label: "Французская", emoji: "🥐", mode: "cuisines" },
  { id: "georgian", label: "Грузинская", emoji: "🥟", mode: "cuisines" },
  { id: "japanese", label: "Японская", emoji: "🍣", mode: "cuisines" },
  { id: "korean", label: "Корейская", emoji: "🥘", mode: "cuisines" },
  { id: "thai", label: "Тайская", emoji: "🌶️", mode: "cuisines" },
];

const POPULAR_DISH_CATEGORY_IDS = [
  "pizza",
  "burgers",
  "sandwiches",
  "shawarma",
  "sushi-rolls",
  "ramen",
  "wok",
  "pasta",
];

const POPULAR_CUISINE_CATEGORY_IDS = [
  "asian",
  "italian",
  "russian",
  "caucasian",
  "american",
  "georgian",
  "mexican",
  "french",
];

function cloneCategories(categories: FoodCategory[]) {
  return categories.map((category) => ({ ...category }));
}

function pickCategoriesById(categories: FoodCategory[], ids: string[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return ids.flatMap((id) => {
    const category = byId.get(id);

    return category ? [{ ...category }] : [];
  });
}

export async function getDishCategories() {
  // TODO: Replace mock data with the backend dish category dictionary endpoint.
  return cloneCategories(DISH_CATEGORIES);
}

export async function getCuisineCategories() {
  // TODO: Replace mock data with the backend cuisine category dictionary endpoint.
  return cloneCategories(CUISINE_CATEGORIES);
}

export async function getPopularDishCategories() {
  // TODO: Replace mock data with the backend popular dish categories endpoint.
  return pickCategoriesById(DISH_CATEGORIES, POPULAR_DISH_CATEGORY_IDS);
}

export async function getPopularCuisineCategories() {
  // TODO: Replace mock data with the backend popular cuisine categories endpoint.
  return pickCategoriesById(CUISINE_CATEGORIES, POPULAR_CUISINE_CATEGORY_IDS);
}

/** Категория заведения (тип точки: фастфуд, кафе и т.п.). */
export type PlaceCategory = {
  id: string;
  label: string;
  emoji: string;
};

// Заглушка на фронте. TODO: заменить на справочник категорий заведений с бэка.
const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: "fastfood", label: "Фастфуд", emoji: "🍟" },
  { id: "cafe", label: "Кафе", emoji: "☕" },
  { id: "restaurant", label: "Ресторан", emoji: "🍽️" },
  { id: "coffee", label: "Кофейня", emoji: "🥐" },
  { id: "bakery", label: "Пекарня", emoji: "🥖" },
  { id: "bar", label: "Бар", emoji: "🍺" },
  { id: "pizzeria", label: "Пиццерия", emoji: "🍕" },
  { id: "sushi-bar", label: "Суши-бар", emoji: "🍣" },
  { id: "canteen", label: "Столовая", emoji: "🥘" },
  { id: "street-food", label: "Стритфуд", emoji: "🌭" },
  { id: "dessert", label: "Десерты", emoji: "🍰" },
  { id: "pub", label: "Паб", emoji: "🍻" },
];

export function getPlaceCategories(): PlaceCategory[] {
  return PLACE_CATEGORIES.map((category) => ({ ...category }));
}

/**
 * Match a Django category name (e.g. "Пицца") to a FoodCategory entry.
 * Used to enrich backend category data with emoji/icon metadata.
 */
export function matchCategoryByName(name: string): FoodCategory | null {
  const normalized = name.trim().toLowerCase();
  const all = [...DISH_CATEGORIES, ...CUISINE_CATEGORIES];
  return all.find((c) => c.label.toLowerCase() === normalized) ?? null;
}

export type ApiCategory = {
  id: number;
  name: string;
  icon: string;
  color: string;
};

/**
 * Загрузить категории с бэка (/api/v1/categories/) и обогатить их emoji/mode
 * из локальной карты. Если бэк недоступен — возвращает пустой массив.
 */
export async function fetchCategories(accessToken?: string): Promise<ApiCategory[]> {
  try {
    const options: RequestInit = accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {};
    const data = await apiRequest("/categories/", options);
    const rawList: { id: number; name: string }[] = Array.isArray(data)
      ? data
      : (data?.results ?? []);

    return rawList.map((cat) => {
      const matched = matchCategoryByName(cat.name);
      return {
        id: cat.id,
        name: cat.name,
        icon: matched?.emoji ?? "🍽️",
        color: matched ? "#2ECC71" : "#888888",
      };
    });
  } catch {
    // Если бэк не отдал категории — возвращаем пустой массив, UI покажет заглушку
    return [];
  }
}

/**
 * Загрузить топ-N популярных тегов с бэка (/api/v1/tags/ уже отсортирован по -usage_count).
 * Используется на странице поиска для блока "Популярные теги".
 */
export async function fetchPopularTags(accessToken?: string, limit = 12): Promise<string[]> {
  try {
    const options: RequestInit = accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {};
    const data = await apiRequest(`/tags/?ordering=-usage_count`, options);
    const rawList: { id: number; name: string; usage_count?: number }[] = Array.isArray(data)
      ? data
      : (data?.results ?? []);

    return rawList
      .filter((t) => t.name)
      .slice(0, limit)
      .map((t) => t.name);
  } catch {
    return [];
  }
}
