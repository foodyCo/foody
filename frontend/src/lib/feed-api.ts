// Stub-слой совместимости для UI-компонентов foody-front.
// На текущем бэке этих ручек либо нет (комменты-лайки), либо они дёргаются другими способами
// (см. lib/feed-client.ts для лайков/сохранений/подписок поверх реального бэка).
// Здесь — заглушки, которые удовлетворяют типам и возвращают локальное состояние.

import type { Post } from "@/lib/mock-data";

export type FeedScope = "new" | "subs";

export type FollowMutationResponse = {
  targetUser: string;
  following: boolean;
  followingUsers: string[];
};

export type LikeMutationResponse = {
  postId: number;
  liked: boolean;
  likedPostIds: number[];
};

export type BookmarkMutationResponse = {
  postId: number;
  saved: boolean;
  savedPostIds: number[];
};

// Тип для страницы избранного (Wave D: /saved).
export type FavoritePostsResponse = {
  currentUser: string | null;
  followingUsers: string[];
  likedPostIds: number[];
  posts: Post[];
  recentFavoriteTags: string[];
  savedPostIds: number[];
  savedPostsCount: number;
};

export function isFeedScope(value: string | null): value is FeedScope {
  return value === "new" || value === "subs";
}

/** Утилита: добавить/убрать postId из массива. */
export function getNextPostIdMembership(
  postIds: number[],
  postId: number,
  included: boolean,
) {
  const hasPostId = postIds.includes(postId);

  if (included) {
    return hasPostId ? postIds : [...postIds, postId];
  }

  return hasPostId ? postIds.filter((id) => id !== postId) : postIds;
}

export async function requestFollowMutation(
  targetUser: string,
  nextFollowing: boolean,
): Promise<FollowMutationResponse> {
  return {
    targetUser,
    following: nextFollowing,
    followingUsers: [],
  };
}

export async function requestLikeMutation(
  postId: number,
  nextLiked: boolean,
): Promise<LikeMutationResponse> {
  return {
    postId,
    liked: nextLiked,
    likedPostIds: [],
  };
}

export async function requestBookmarkMutation(
  postId: number,
  nextSaved: boolean,
): Promise<BookmarkMutationResponse> {
  return {
    postId,
    saved: nextSaved,
    savedPostIds: [],
  };
}

export async function requestCommentLikes(_commentIds: Array<number | string>) {
  return { likedCommentIds: [] as string[] };
}

export async function requestCommentLikeMutation(
  commentId: number | string,
  nextLiked: boolean,
) {
  return {
    commentId,
    liked: nextLiked,
    likedCommentIds: [] as string[],
  };
}
