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
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      redirect("/login");
    }
  }

  const posts = apiPosts.map(mapApiPostToFeedPost);
  const likedIds = apiPosts.filter((p) => p.is_liked).map((p) => p.id);
  const savedIds = apiPosts.filter((p) => p.is_saved).map((p) => p.id);

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
    />
  );
}
