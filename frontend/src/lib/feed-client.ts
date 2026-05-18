// Клиентские мутации используют относительный путь — браузер сам подставит origin.
// На проде: https://foody.press/api/v1/...
// На локалке через Caddy: http://localhost/api/v1/...
// НИКОГДА не использовать NEXT_PUBLIC_API_URL здесь — это CSR-слой.
const API_BASE = "/api/v1";

async function authedFetch(
  path: string,
  token: string,
  init: RequestInit = {},
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  return res;
}

export async function toggleLike(postId: number, token: string) {
  const res = await authedFetch(`/posts/${postId}/like/`, token, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`like failed: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function toggleSave(postId: number, token: string) {
  const res = await authedFetch(`/posts/${postId}/save_post/`, token, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
  return res.json().catch(() => ({}));
}

export async function toggleFollow(
  username: string,
  targetUserId: number | null,
  token: string,
  nextFollowing: boolean,
) {
  if (!targetUserId) throw new Error("targetUserId required");
  const res = await authedFetch(
    `/users/${targetUserId}/subscribe/`,
    token,
    { method: nextFollowing ? "POST" : "DELETE" },
  );
  if (!res.ok) throw new Error(`follow failed: ${res.status}`);
  return res.json().catch(() => ({}));
}
