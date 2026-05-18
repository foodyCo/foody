import { auth } from "@/auth";
import { apiRequest } from "@/lib/api";
import { mapApiPostToFeedPost, type ApiPost } from "@/lib/feed-adapter";
import { SinglePostView } from "@/components/feed/single-post-view";
import { GlassSurface } from "@/components/feed/glass-surface";

export default async function DishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await auth()) as any;
  const accessToken: string | null = session?.user?.accessToken ?? null;

  let apiPost: ApiPost | null = null;
  try {
    const options: any = { headers: {} };
    if (accessToken) options.headers.Authorization = `Bearer ${accessToken}`;
    apiPost = (await apiRequest(`/posts/${id}/`, options)) as ApiPost;
  } catch {
    /* not found */
  }

  if (!apiPost) {
    return (
      <main className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 flex flex-col px-4 pt-16 pb-25">
          <GlassSurface className="flex flex-1 items-center justify-center rounded-[26px] border border-white/65 bg-white/45">
            <div className="max-w-[260px] px-6 text-center">
              <p className="text-[20px] font-extrabold text-[#15291C]">Пост не найден</p>
              <p className="mt-2 text-[14px] font-medium text-[#5C6B62]">
                Возможно, его удалили или он ещё на модерации.
              </p>
            </div>
          </GlassSurface>
        </div>
      </main>
    );
  }

  const post = mapApiPostToFeedPost(apiPost);
  const initialLiked = Boolean(apiPost.is_liked);
  const initialSaved = Boolean(apiPost.is_saved);

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
    <SinglePostView
      post={post}
      initialLiked={initialLiked}
      initialSaved={initialSaved}
      currentUser={currentUserHandle}
      accessToken={accessToken}
    />
  );
}
