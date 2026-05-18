"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { FeedHeader, type FeedTab } from "@/components/feed/feed-header";
import { GlassSurface } from "@/components/feed/glass-surface";
import { PostCard } from "@/components/feed/post-card";
import type { Post } from "@/lib/mock-data";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";
import { toggleLike, toggleSave, toggleFollow } from "@/lib/feed-client";

const TWEAKS = DEFAULT_TWEAKS;

function FeedStatusCard({
  body,
  title,
  action,
}: {
  body: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full snap-start snap-always flex-col px-3.5 pt-2 pb-[5.75rem]">
      <GlassSurface className="flex flex-1 items-center justify-center rounded-[26px] border border-green-50/92 bg-white/45">
        <div className="max-w-[282px] px-6 text-center">
          <p className="text-[20px] leading-tight font-extrabold tracking-[-0.35px] text-[#15291C]">
            {title}
          </p>
          <p className="mt-2 font-[family-name:var(--font-roboto)] text-[14.5px] leading-[1.45] font-medium text-[#5C6B62]">
            {body}
          </p>
          {action && <div className="mt-4 flex justify-center">{action}</div>}
        </div>
      </GlassSurface>
    </div>
  );
}

type FeedClientProps = {
  initialPosts: Post[];
  likedIds: number[];
  savedIds: number[];
  currentUser: string | null;
  accessToken: string | null;
  initialTab?: FeedTab;
};

export function FeedClient({
  initialPosts,
  likedIds,
  savedIds,
  currentUser,
  accessToken,
  initialTab = "new",
}: FeedClientProps) {
  const [feedTab, setFeedTab] = useState<FeedTab>(initialTab);
  const [posts] = useState<Post[]>(initialPosts);
  const [likedSet, setLikedSet] = useState<Set<number>>(() => new Set(likedIds));
  const [savedSet, setSavedSet] = useState<Set<number>>(() => new Set(savedIds));
  const [pendingLikes, setPendingLikes] = useState<Set<number>>(() => new Set());
  const [pendingSaves, setPendingSaves] = useState<Set<number>>(() => new Set());
  const [followingSet, setFollowingSet] = useState<Set<string>>(() => new Set());
  const [pendingFollows, setPendingFollows] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(id);
    }
  }, [notice]);

  const onTabChange = useCallback((next: FeedTab) => {
    if (next === feedTab) return;
    const params = new URLSearchParams();
    if (next === "subs") params.set("tab", "following");
    window.location.assign(params.toString() ? `/?${params.toString()}` : "/");
  }, [feedTab]);

  const onLikeToggle = useCallback(
    async (postId: number, nextLiked: boolean) => {
      if (!accessToken || pendingLikes.has(postId)) return;
      setPendingLikes((s) => new Set(s).add(postId));
      try {
        await toggleLike(postId, accessToken);
        setLikedSet((s) => {
          const next = new Set(s);
          if (nextLiked) next.add(postId);
          else next.delete(postId);
          return next;
        });
      } catch {
        setNotice("Не удалось обновить лайк.");
      } finally {
        setPendingLikes((s) => {
          const next = new Set(s);
          next.delete(postId);
          return next;
        });
      }
    },
    [accessToken, pendingLikes],
  );

  const onSaveToggle = useCallback(
    async (postId: number, nextSaved: boolean) => {
      if (!accessToken || pendingSaves.has(postId)) return;
      setPendingSaves((s) => new Set(s).add(postId));
      try {
        await toggleSave(postId, accessToken);
        setSavedSet((s) => {
          const next = new Set(s);
          if (nextSaved) next.add(postId);
          else next.delete(postId);
          return next;
        });
      } catch {
        setNotice("Не удалось обновить избранное.");
      } finally {
        setPendingSaves((s) => {
          const next = new Set(s);
          next.delete(postId);
          return next;
        });
      }
    },
    [accessToken, pendingSaves],
  );

  const onFollowToggle = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!accessToken || pendingFollows.has(author)) return;
      const target = posts.find((p) => p.user === author);
      const targetUserId = target?.userId;
      if (!targetUserId) {
        setNotice("Не удалось определить пользователя для подписки.");
        return;
      }
      setPendingFollows((s) => new Set(s).add(author));
      try {
        await toggleFollow(author, targetUserId, accessToken, nextFollowing);
        setFollowingSet((s) => {
          const next = new Set(s);
          if (nextFollowing) next.add(author);
          else next.delete(author);
          return next;
        });
      } catch {
        setNotice("Не удалось обновить подписку.");
      } finally {
        setPendingFollows((s) => {
          const next = new Set(s);
          next.delete(author);
          return next;
        });
      }
    },
    [accessToken, pendingFollows, posts],
  );

  const likedSnapshot = useMemo(() => likedSet, [likedSet]);
  const savedSnapshot = useMemo(() => savedSet, [savedSet]);

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <FeedHeader
          brand={TWEAKS.brand}
          tab={feedTab}
          onTabChange={onTabChange}
          currentUser={currentUser}
        />

        <section
          aria-label="Лента"
          className="hide-scroll flex-1 snap-y snap-mandatory overflow-y-auto pb-24"
        >
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                brand={TWEAKS.brand}
                density={TWEAKS.density}
                currentUser={currentUser}
                isAuthorFollowed={followingSet.has(post.user)}
                isFollowPending={pendingFollows.has(post.user)}
                isLiked={likedSnapshot.has(post.id)}
                isLikePending={pendingLikes.has(post.id)}
                isSaved={savedSnapshot.has(post.id)}
                isSavePending={pendingSaves.has(post.id)}
                onFollowToggle={onFollowToggle}
                onLikeToggle={onLikeToggle}
                onSaveToggle={onSaveToggle}
              />
            ))
          ) : (
            <FeedStatusCard
              title={feedTab === "subs" ? "Подписок пока нет" : "Постов пока нет"}
              body={
                feedTab === "subs"
                  ? "Подпишитесь на авторов из раздела «Новое», и их посты появятся здесь."
                  : "Свежие рекомендации появятся здесь чуть позже."
              }
            />
          )}
        </section>

        {notice && (
          <div className="pointer-events-none absolute right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <p role="status">{notice}</p>
          </div>
        )}
      </div>
    </main>
  );
}
