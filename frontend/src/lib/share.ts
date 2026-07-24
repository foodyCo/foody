// Шаринг поста: на телефоне (и части десктопов) открывает нативное меню
// «Поделиться» через Web Share API (мессенджеры, почта…). Где API нет —
// откатываемся на копирование ссылки.

export function buildPostShareUrl(postId: number): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL("/", origin || "http://localhost");
  url.searchParams.set("post", String(postId));
  return url.toString();
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.top = "-999px";
      field.style.left = "-999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * "shared" — открыли нативное меню (или юзер его закрыл — тоже ок, ничего не
 * копируем); "copied" — API нет, скопировали ссылку; "failed" — не удалось.
 */
export async function sharePost(
  postId: number,
  opts: { title?: string; text?: string } = {}
): Promise<"shared" | "copied" | "failed"> {
  if (typeof window === "undefined") return "failed";
  const url = buildPostShareUrl(postId);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return "shared";
    } catch (error) {
      // Юзер закрыл меню — это не ошибка, копировать не нужно.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
      // Иная ошибка share — падаем на копирование ниже.
    }
  }

  return (await copyToClipboard(url)) ? "copied" : "failed";
}
