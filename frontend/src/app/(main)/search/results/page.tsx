import { auth } from "@/auth";
import { apiRequest } from "@/lib/api";
import { GlassSurface } from "@/components/feed/glass-surface";
import { SaveRecentSearchQuery } from "@/components/search/save-recent-search-query";
import { SearchResultsFeed } from "@/components/search/search-results-feed";
import { SearchResultsHeader } from "@/components/search/search-results-header";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";
import { mapApiPostToFeedPost, type ApiPost } from "@/lib/feed-adapter";
import {
  getSingleSearchParam,
  normalizeSearchQuery,
} from "@/lib/search";

type SearchResultsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category_id?: string | string[];
    price_min?: string | string[];
    price_max?: string | string[];
  }>;
};

export default async function SearchResultsPage({
  searchParams,
}: SearchResultsPageProps) {
  const params = await searchParams;
  const query = getSingleSearchParam(params.q);
  const normalizedQuery = normalizeSearchQuery(query);
  const categoryId = getSingleSearchParam(params.category_id);
  const priceMin = getSingleSearchParam(params.price_min);
  const priceMax = getSingleSearchParam(params.price_max);

  const session = (await auth()) as any;
  const accessToken: string | null = session?.user?.accessToken ?? null;

  const qs = new URLSearchParams();
  if (normalizedQuery) qs.set("search", normalizedQuery);
  if (categoryId) qs.set("category_id", categoryId);
  if (priceMin) qs.set("price_min", priceMin);
  if (priceMax) qs.set("price_max", priceMax);
  const endpoint = qs.toString() ? `/posts/?${qs.toString()}` : "/posts/";

  let apiPosts: ApiPost[] = [];
  try {
    const options: any = { headers: {} };
    if (accessToken) options.headers.Authorization = `Bearer ${accessToken}`;
    const data = await apiRequest(endpoint, options);
    const results = Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data)
      ? data
      : [];
    apiPosts = results as ApiPost[];
  } catch {
    /* ignore — отдадим пустые результаты */
  }

  const posts = apiPosts.map(mapApiPostToFeedPost);
  const likedPostIds = apiPosts.filter((p) => p.is_liked).map((p) => p.id);
  const savedPostIds = apiPosts.filter((p) => p.is_saved).map((p) => p.id);

  let currentUserHandle: string | null = null;
  if (accessToken) {
    try {
      const me = await apiRequest("/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      currentUserHandle = me?.username ? `@${me.username}` : null;
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="absolute inset-0 overflow-hidden">
      <SaveRecentSearchQuery query={query} />
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <SearchResultsHeader key={query.trim()} initialQuery={query.trim()} />

        <section
          aria-label="Результаты поиска"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {posts.length > 0 ? (
            <SearchResultsFeed
              brand={DEFAULT_TWEAKS.brand}
              currentUser={currentUserHandle}
              accessToken={accessToken}
              density={DEFAULT_TWEAKS.density}
              initialFollowingUsers={[]}
              initialLikedPostIds={likedPostIds}
              initialSavedPostIds={savedPostIds}
              posts={posts}
            />
          ) : (
            <div className="flex h-full snap-start snap-always flex-col px-3.5 pt-2 pb-[5.75rem]">
              <GlassSurface className="mt-2 flex flex-1 items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
                <div className="max-w-[260px] px-6 text-center">
                  <p className="text-[20px] leading-tight font-extrabold tracking-[-0.35px] text-[#15291C]">
                    Ничего не нашли
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-roboto)] text-[14.5px] leading-[1.45] font-medium text-[#5C6B62]">
                    {normalizedQuery
                      ? `По запросу «${query.trim()}» пока нет постов.`
                      : "Введите запрос, чтобы собрать ленту результатов."}
                  </p>
                </div>
              </GlassSurface>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
