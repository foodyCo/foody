import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { FeedClient } from "@/components/feed/feed-client";
import { mapApiPostToFeedPost, type ApiPost } from "@/lib/feed-adapter";
import type { FeedTab } from "@/components/feed/feed-header";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  // Принимаем оба алиаса: ?tab=following (внутренний URL фронта) и
  // ?tab=subs (короткая форма, упоминается в сценариях/документации).
  const tabParam = searchParams.tab;
  const isFollowingTab = tabParam === "following" || tabParam === "subs";
  const initialTab: FeedTab = isFollowingTab ? "subs" : "new";

  const session = (await auth()) as any;
  const accessToken: string | null = session?.user?.accessToken ?? null;

  const endpoint = isFollowingTab ? "/posts/following/" : "/posts/";
  let apiPosts: ApiPost[] = [];
  // R4-B2 infinite scroll: бэк отдаёт page-number пагинацию
  // (count/next/previous/results). next === null значит больше страниц нет.
  let initialHasMore = false;
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
    initialHasMore = Boolean(data?.next);
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      redirect("/login");
    }
  }

  const posts = apiPosts.map(mapApiPostToFeedPost);
  const likedIds = apiPosts.filter((p) => p.is_liked).map((p) => p.id);
  const savedIds = apiPosts.filter((p) => p.is_saved).map((p) => p.id);

  // R4-B4: начальный список подписок — пока пустой массив.
  // Бэк не отдаёт is_following в FeedPostAuthorSerializer, а /users/me/following/
  // не реализован. После клика «Подписаться» состояние трекается на клиенте
  // (тот же паттерн что и в search-results-feed.tsx, см. строка с
  // `initialFollowingUsers={[]}`). При перезагрузке страницы кнопка снова
  // покажет «Подписаться» — это известный trade-off до появления is_following
  // в API ленты или эндпоинта /users/me/following/.
  const initialFollowingUsers: string[] = [];

  let myHandle: string | null = null;
  if (accessToken) {
    try {
      const me = await apiRequest("/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      myHandle = me?.username ? `@${me.username}` : null;
    } catch {
      /* ignore */
    }
  }

  return (
    <FeedClient
      initialPosts={posts}
      likedIds={likedIds}
      savedIds={savedIds}
      currentUser={myHandle}
      accessToken={accessToken}
      initialTab={initialTab}
      initialNextPage={initialHasMore ? 2 : null}
      endpoint={endpoint}
      initialFollowingUsers={initialFollowingUsers}
    />
  );
}
