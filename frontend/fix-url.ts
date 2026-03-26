export function fixMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith("http://backend:8000")) {
        return url.replace("http://backend:8000", "http://localhost:8000");
    }
    return url;
}
