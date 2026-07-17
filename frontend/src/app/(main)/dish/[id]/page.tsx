import { auth } from "@/auth";
import { apiRequest } from "@/lib/api";
import { mapApiPostToFeedPost, type ApiPost } from "@/lib/feed-adapter";
import { SinglePostView } from "@/components/feed/single-post-view";
import { GlassSurface } from "@/components/feed/glass-surface";
import { Clock, AlertTriangle } from "lucide-react";

export default async function DishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await auth()) as any;
  const accessToken: string | null = session?.user?.accessToken ?? null;
  const currentUserId: string | null = session?.user?.id ?? null;

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
          <GlassSurface className="flex flex-1 items-center justify-center rounded-[26px] border border-white/65 bg-white/45 shadow-[0_8px_24px_rgba(20,40,28,0.10),0_2px_6px_rgba(20,40,28,0.06)]">
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

  // Баннер статуса модерации виден ТОЛЬКО автору поста.
  // is_staff тоже может видеть pending/rejected (через /moderation/), но в обычном
  // /dish/{id} мы показываем баннер только своему автору, чтобы он понимал
  // где его пост в воронке модерации и какова причина если отклонён.
  const isAuthor =
    currentUserId != null &&
    apiPost.user?.id != null &&
    String(apiPost.user.id) === String(currentUserId);
  const status = apiPost.status;
  const showPendingBanner = isAuthor && status === "pending";
  const showRejectedBanner = isAuthor && status === "rejected";

  return (
    <>
      {(showPendingBanner || showRejectedBanner) && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[max(env(safe-area-inset-top),12px)]">
          {showPendingBanner && (
            <div className="pointer-events-auto mx-auto flex max-w-[640px] items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-3.5 py-2.5 text-[12.5px] font-semibold text-amber-900 shadow-[0_8px_20px_rgba(160,110,20,0.18)] backdrop-blur-[12px]">
              <Clock className="mt-px size-4 shrink-0" strokeWidth={2.3} />
              <div className="leading-snug">
                <div className="font-bold">Пост на модерации</div>
                <div className="font-medium text-amber-800/85">
                  Виден только вам. После одобрения модератором появится в общей ленте.
                </div>
              </div>
            </div>
          )}
          {showRejectedBanner && (
            <div className="pointer-events-auto mx-auto flex max-w-[640px] items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50/95 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-900 shadow-[0_8px_20px_rgba(180,40,40,0.18)] backdrop-blur-[12px]">
              <AlertTriangle className="mt-px size-4 shrink-0" strokeWidth={2.3} />
              <div className="leading-snug">
                <div className="font-bold">Пост отклонён модератором</div>
                {apiPost.rejection_reason ? (
                  <div className="font-medium text-red-800/85">
                    Причина: {apiPost.rejection_reason}
                  </div>
                ) : (
                  <div className="font-medium text-red-800/70">
                    Причина не указана.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <SinglePostView
        post={post}
        initialLiked={initialLiked}
        initialSaved={initialSaved}
        currentUser={currentUserHandle}
        accessToken={accessToken}
      />
    </>
  );
}
