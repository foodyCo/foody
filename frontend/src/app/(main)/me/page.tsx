import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon, MapPin } from "lucide-react";
import { apiRequest, fixMediaUrl, mapDjangoPostToDish } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassSurface } from "@/components/feed/glass-surface";

function PostThumb({ post }: { post: any }) {
  return (
    <Link
      href={`/dish/${post.id}`}
      className="group block aspect-square overflow-hidden rounded-2xl border border-white/65 bg-white/55 shadow-[0_8px_22px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[16px]"
    >
      {post.imageUrl && post.imageUrl !== "/placeholder.png" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt={post.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="grid size-full place-items-center bg-[linear-gradient(135deg,rgba(220,230,222,0.5),rgba(255,255,255,0.7))] p-3 text-center">
          <div>
            <p className="text-[14px] font-semibold text-[#15291C]">{post.title}</p>
            <p className="mt-1 text-[11px] font-medium text-[#5C6B62]">
              {Number(post.userRating || 0).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
}

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; profileSaved?: string }>;
}) {
  const { tab, profileSaved } = await searchParams;
  const activeTab = tab === "saved" ? "saved" : "posts";

  const session = (await auth()) as any;
  if (!session?.user?.accessToken) {
    redirect("/login");
  }

  const token = session.user.accessToken;
  let userProfile: any = null;
  let postsResult: any[] = [];
  let savedResult: any[] = [];

  try {
    const [posts, saved, me] = await Promise.all([
      apiRequest("/posts/my/", { headers: { Authorization: `Bearer ${token}` } }),
      apiRequest("/posts/saved/", { headers: { Authorization: `Bearer ${token}` } }),
      apiRequest("/users/me/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
    ]);
    postsResult = Array.isArray(posts?.results || posts)
      ? (posts?.results || posts).map(mapDjangoPostToDish)
      : [];
    savedResult = Array.isArray(saved?.results || saved)
      ? (saved?.results || saved).map(mapDjangoPostToDish)
      : [];
    userProfile = me;
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") redirect("/login");
  }

  const handle = userProfile?.username || session.user.email?.split("@")[0] || "user";
  const name = userProfile?.full_name || userProfile?.username || "Пользователь";
  const avatar = fixMediaUrl(userProfile?.avatar) || "";
  const city = userProfile?.city || "";
  const bio = userProfile?.bio_text || "";
  const stats = {
    posts: userProfile?.posts_count ?? postsResult.length,
    followers: userProfile?.followers_count ?? 0,
    following: userProfile?.following_count ?? 0,
  };

  const listToShow = activeTab === "saved" ? savedResult : postsResult;

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-12.5">
        <header className="flex items-center justify-between px-5 pb-3">
          <h1 className="text-[20px] font-extrabold tracking-[-0.3px] text-[#15291C]">
            @{handle}
          </h1>
          <Link
            href="/settings"
            aria-label="Настройки"
            className="grid size-10 place-items-center rounded-full border border-white/65 bg-white/58 text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.78)] backdrop-blur-[18px]"
          >
            <SettingsIcon className="size-5" strokeWidth={2.2} />
          </Link>
        </header>

        <section className="hide-scroll flex-1 overflow-y-auto px-4 pb-25">
          {profileSaved === "1" && (
            <div className="mb-3 rounded-2xl border border-green-200 bg-green-50/80 px-4 py-3 text-center text-[13px] font-semibold text-green-800">
              Профиль сохранён
            </div>
          )}

          <GlassSurface className="rounded-[26px] border border-white/65 bg-white/45 px-5 py-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-22 border-2 border-white shadow-[0_10px_28px_rgba(20,40,28,0.18)]">
                {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                <AvatarFallback className="bg-[#2ECC71]/30 text-[24px] font-extrabold text-[#15291C]">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.3px] text-[#15291C]">
                {name}
              </h2>

              {city && (
                <div className="mt-1 flex items-center gap-1 text-[13.5px] font-medium text-[#5C6B62]">
                  <MapPin className="size-4" strokeWidth={2} />
                  <span>{city}</span>
                </div>
              )}

              {bio && (
                <p className="mt-3 max-w-md text-[14px] leading-[1.45] font-medium text-[#5C6B62]">
                  {bio}
                </p>
              )}

              <Link
                href="/me/edit"
                className="mt-4 inline-flex h-9 items-center rounded-full bg-white/82 px-5 text-[13px] font-bold text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(20,40,28,0.1)] hover:bg-white"
              >
                Редактировать профиль
              </Link>

              <div className="mt-5 grid w-full max-w-sm grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-[20px] font-extrabold text-[#15291C]">{stats.posts}</div>
                  <div className="text-[11.5px] font-semibold tracking-wide text-[#8A958E] uppercase">Посты</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-extrabold text-[#15291C]">{stats.followers}</div>
                  <div className="text-[11.5px] font-semibold tracking-wide text-[#8A958E] uppercase">Подписчики</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-extrabold text-[#15291C]">{stats.following}</div>
                  <div className="text-[11.5px] font-semibold tracking-wide text-[#8A958E] uppercase">Подписки</div>
                </div>
              </div>
            </div>
          </GlassSurface>

          <div className="mt-5 grid grid-cols-2 rounded-full border border-white/60 bg-white/40 p-1 shadow-[inset_1px_1px_0_rgba(255,255,255,0.7)]">
            <Link
              href="/me?tab=posts"
              prefetch={false}
              className={
                "rounded-full py-2 text-center text-[13.5px] font-bold transition-colors " +
                (activeTab === "posts"
                  ? "bg-white text-[#15291C] shadow-[0_4px_12px_rgba(20,40,28,0.08)]"
                  : "text-[#5C6B62]")
              }
            >
              Посты
            </Link>
            <Link
              href="/me?tab=saved"
              prefetch={false}
              className={
                "rounded-full py-2 text-center text-[13.5px] font-bold transition-colors " +
                (activeTab === "saved"
                  ? "bg-white text-[#15291C] shadow-[0_4px_12px_rgba(20,40,28,0.08)]"
                  : "text-[#5C6B62]")
              }
            >
              Сохранённое
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listToShow.length === 0 ? (
              <div className="col-span-full py-10 text-center text-[14px] font-medium text-[#5C6B62]">
                {activeTab === "saved" ? "Нет сохранённых постов." : "У вас пока нет постов."}
              </div>
            ) : (
              listToShow.map((p: any) => <PostThumb key={p.id} post={p} />)
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
