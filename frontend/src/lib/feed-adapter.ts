import type { Post } from "@/lib/mock-data";
import { fixMediaUrl } from "@/lib/api";

export type ApiPostImage = { id?: number; image: string; uploaded_at?: string };

export type ApiPostUser = {
  id: number;
  username: string;
  full_name?: string | null;
  avatar?: string | null;
};

export type ApiPost = {
  id: number;
  user: ApiPostUser;
  restaurant?: number | { id: number } | null;
  restaurant_name?: string | null;
  dish?: number | null;
  dish_name?: string | null;
  description: string;
  price?: string | null;
  created_at: string;
  images?: ApiPostImage[];
  statistics?: {
    likes_count?: number;
    saves_count?: number;
    comments_count?: number;
    rating?: number;
  };
  tags?: { id: number; name: string }[];
  is_liked?: boolean;
  is_saved?: boolean;
  status?: string;
};

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "только что";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} с`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} дн`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} мес`;
  return `${Math.floor(mon / 12)} г`;
}

export function mapApiPostToFeedPost(api: ApiPost): Post {
  const stats = api.statistics || {};
  const rawRating = stats.rating ?? 0;
  const photoUrls = (api.images || [])
    .map((img) => fixMediaUrl(img.image))
    .filter(Boolean) as string[];

  return {
    id: api.id,
    user: `@${api.user.username}`,
    realName: api.user.full_name || api.user.username,
    when: formatRelative(api.created_at),
    dish: api.dish_name ?? "",
    place: api.restaurant_name ?? "",
    rating: Math.round(rawRating * 10) / 10,
    price: api.price ? `₽${Math.round(parseFloat(api.price))}` : "",
    text: api.description || "",
    tags: (api.tags || []).map((t) => `#${t.name}`),
    photos: photoUrls.length || (api.images?.length ?? 0),
    likes: stats.likes_count ?? 0,
    comments: stats.comments_count ?? 0,
    seed: api.id,
    photoUrls,
    avatarUrl: fixMediaUrl(api.user.avatar) || undefined,
    userId: api.user.id,
  };
}

export type FeedData = {
  posts: ReturnType<typeof mapApiPostToFeedPost>[];
  likedPostIds: number[];
  savedPostIds: number[];
  followingUsernames: string[];
  currentUserHandle: string | null;
};

export function adaptApiFeed(
  apiPosts: ApiPost[],
  currentUsername: string | null,
  followingUsernames: string[] = [],
): FeedData {
  const posts = apiPosts.map(mapApiPostToFeedPost);
  return {
    posts,
    likedPostIds: apiPosts.filter((p) => p.is_liked).map((p) => p.id),
    savedPostIds: apiPosts.filter((p) => p.is_saved).map((p) => p.id),
    followingUsernames: followingUsernames.map((u) =>
      u.startsWith("@") ? u : `@${u}`,
    ),
    currentUserHandle: currentUsername ? `@${currentUsername}` : null,
  };
}
