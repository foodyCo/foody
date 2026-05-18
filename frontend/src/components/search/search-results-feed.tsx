"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PostCard } from "@/components/feed/post-card";
import {
  requestBookmarkMutation,
  requestFollowMutation,
  requestLikeMutation,
} from "@/lib/feed-api";
import type { Density, Post } from "@/lib/mock-data";

type SearchResultsFeedProps = {
  brand: string;
  currentUser: string | null;
  density: Density;
  initialFollowingUsers: string[];
  initialLikedPostIds: number[];
  initialSavedPostIds: number[];
  posts: Post[];
};

export function SearchResultsFeed({
  brand,
  currentUser,
  density,
  initialFollowingUsers,
  initialLikedPostIds,
  initialSavedPostIds,
  posts,
}: SearchResultsFeedProps) {
  const [followingUsers, setFollowingUsers] = useState(initialFollowingUsers);
  const [likedPostIds, setLikedPostIds] = useState(initialLikedPostIds);
  const [savedPostIds, setSavedPostIds] = useState(initialSavedPostIds);
  const [pendingAuthors, setPendingAuthors] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const [pendingSavePostIds, setPendingSavePostIds] = useState<Set<number>>(
    () => new Set()
  );
  const [notice, setNotice] = useState<string | null>(null);
  const followingUsersSet = useMemo(
    () => new Set(followingUsers),
    [followingUsers]
  );
  const likedPostIdsSet = useMemo(
    () => new Set(likedPostIds),
    [likedPostIds]
  );
  const savedPostIdsSet = useMemo(
    () => new Set(savedPostIds),
    [savedPostIds]
  );

  const toggleFollow = useCallback(
    async (author: string, nextFollowing: boolean) => {
      if (!currentUser || pendingAuthors.has(author)) {
        return;
      }

      setNotice(null);
      setPendingAuthors((currentAuthors) => {
        const nextAuthors = new Set(currentAuthors);
        nextAuthors.add(author);

        return nextAuthors;
      });

      try {
        const result = await requestFollowMutation(author, nextFollowing);

        setFollowingUsers(result.followingUsers);
      } catch {
        setNotice("Не удалось обновить подписку. Попробуйте ещё раз.");
      } finally {
        setPendingAuthors((currentAuthors) => {
          const nextAuthors = new Set(currentAuthors);
          nextAuthors.delete(author);

          return nextAuthors;
        });
      }
    },
    [currentUser, pendingAuthors]
  );

  const toggleLike = useCallback(
    async (postId: number, nextLiked: boolean) => {
      if (!currentUser || pendingLikePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingLikePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });

      try {
        const result = await requestLikeMutation(postId, nextLiked);

        setLikedPostIds(result.likedPostIds);
      } catch {
        setNotice("Не удалось обновить лайк. Попробуйте ещё раз.");
      } finally {
        setPendingLikePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [currentUser, pendingLikePostIds]
  );

  const toggleSave = useCallback(
    async (postId: number, nextSaved: boolean) => {
      if (!currentUser || pendingSavePostIds.has(postId)) {
        return;
      }

      setNotice(null);
      setPendingSavePostIds((currentPostIds) => {
        const nextPostIds = new Set(currentPostIds);
        nextPostIds.add(postId);

        return nextPostIds;
      });

      try {
        const result = await requestBookmarkMutation(postId, nextSaved);

        setSavedPostIds(result.savedPostIds);
      } catch {
        setNotice("Не удалось обновить избранное. Попробуйте ещё раз.");
      } finally {
        setPendingSavePostIds((currentPostIds) => {
          const nextPostIds = new Set(currentPostIds);
          nextPostIds.delete(postId);

          return nextPostIds;
        });
      }
    },
    [currentUser, pendingSavePostIds]
  );

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <PostCard
            post={post}
            brand={brand}
            currentUser={currentUser}
            density={density}
            isAuthorFollowed={followingUsersSet.has(post.user)}
            isFollowPending={pendingAuthors.has(post.user)}
            isLiked={likedPostIdsSet.has(post.id)}
            isLikePending={pendingLikePostIds.has(post.id)}
            isSaved={savedPostIdsSet.has(post.id)}
            isSavePending={pendingSavePostIds.has(post.id)}
            onFollowToggle={toggleFollow}
            onLikeToggle={toggleLike}
            onSaveToggle={toggleSave}
          />
          <div className="px-3.5 -mt-2 pb-4 flex justify-end">
            <Link
              href={`/dish/${post.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-white/82 px-3 py-1.5 text-[12px] font-bold text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(20,40,28,0.08)] hover:bg-white"
            >
              Открыть пост
              <ChevronRight className="size-3.5" strokeWidth={2.4} />
            </Link>
          </div>
        </div>
      ))}

      {notice && (
        <div className="pointer-events-none fixed right-4 bottom-[6.25rem] left-4 z-30 rounded-[18px] border border-white/70 bg-white/78 px-4 py-3 text-center text-[13px] leading-tight font-bold text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
          <p role="status">{notice}</p>
        </div>
      )}
    </>
  );
}
