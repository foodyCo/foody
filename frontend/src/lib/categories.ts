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

/**
 * Match a Django category name (e.g. "Пицца") to a FoodCategory entry.
 * Used to enrich backend category data with emoji/icon metadata.
 */
export function matchCategoryByName(name: string): FoodCategory | null {
  const normalized = name.trim().toLowerCase();
  const all = [...DISH_CATEGORIES, ...CUISINE_CATEGORIES];
  return all.find((c) => c.label.toLowerCase() === normalized) ?? null;
}
