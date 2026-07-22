import { auth } from "@/auth";
import { SearchComposer } from "@/components/search/search-composer";
import { fetchPopularTags, getPopularDishCategories } from "@/lib/categories";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";

export default async function SearchPage() {
  const session = (await auth()) as any;
  const accessToken: string | undefined = session?.user?.accessToken;

  // Тянем популярные теги из API. Бэк отдаёт /tags/ отсортированными по -usage_count.
  // Если по какой-то причине запрос не удался — массив пустой, секция просто схлопнется.
  const popularTags = await fetchPopularTags(accessToken, 12);
  // Популярные категории (плитки). 7 + плитка «Все» = 2 ряда по 4.
  const popularCategories = (await getPopularDishCategories()).slice(0, 7);

  return (
    <main className="absolute inset-0 overflow-hidden">
      <SearchComposer
        brand={DEFAULT_TWEAKS.brand}
        popularTags={popularTags}
        popularCategories={popularCategories}
      />
    </main>
  );
}
