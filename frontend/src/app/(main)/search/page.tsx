import { auth } from "@/auth";
import { SearchHistory } from "@/components/search/search-history";
import { fetchPopularTags } from "@/lib/categories";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";

export default async function SearchPage() {
  const session = (await auth()) as any;
  const accessToken: string | undefined = session?.user?.accessToken;

  // Тянем популярные теги из API. Бэк отдаёт /tags/ отсортированными по -usage_count.
  // Если по какой-то причине запрос не удался — массив пустой, секция просто схлопнется.
  const popularTags = await fetchPopularTags(accessToken, 12);

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <div className="hide-scroll flex-1 overflow-y-auto pb-25">
          <SearchHistory brand={DEFAULT_TWEAKS.brand} popularTags={popularTags} />
        </div>
      </div>
    </main>
  );
}
