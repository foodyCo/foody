import { auth } from "@/auth";
import FeedItem from "@/components/FeedItem";
import { getSearchPosts, getFollowingPosts } from "@/app/actions/post";
import { redirect } from "next/navigation";

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const isFollowingTab = searchParams.tab === 'following';

  const session = await auth() as any;
  const accessToken = session?.user?.accessToken;

  let posts: any[] = [];
  try {
      if (isFollowingTab && accessToken) {
          posts = await getFollowingPosts(accessToken);
      } else {
          posts = await getSearchPosts(undefined, undefined, undefined, accessToken);
      }
  } catch (e: any) {
      if (e.message === "UNAUTHORIZED") {
          redirect("/login");
      }
      console.error("Failed to load posts", e);
  }

  // Не меняя бекенд мы можем только имитировать Подписки 
  // (например, показывая те посты на которые подписаны, но бэкенд не возвращает currently
  // так как isSubscribed всегда false, мы пока можем просто показывать пустой список
  // или если вы хотите, можете закомментировать фильтр, чтобы показывались все посты)
  let dishes = (posts || []).map((dish: any) => {
    return {
      dish,
      isLiked: dish.isLiked, // mapDjangoPostToDish ставит это поле
      isSubscribed: false, // Бекенд пока не отдает статус подписки, поэтому все false
      communityRating: dish.userRating
    }
  });

  // Для вкладки подписок теперь приходят реальные данные с бэкенда.
  // Можно считать, что для этих постов isSubscribed = true, т.к. они из ленты подписок.
  if (isFollowingTab) {
    dishes = dishes.map((d: any) => ({ ...d, isSubscribed: true }));
  }

  return (
    <>
      <div className="feed" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-base)', maxWidth: '600px', margin: '0 auto', width: '100%', paddingTop: '120px', paddingBottom: '100px' }}>
        {dishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <p>{isFollowingTab ? "Здесь появятся посты людей, на которых вы подписаны." : "Пока нет постов. Создайте первый пост!"}</p>
          </div>
        ) : (
          dishes.map(({ dish, isLiked, isSubscribed, communityRating }: any) => (
            <FeedItem
              key={dish.id}
              dish={dish}
              initialIsLiked={isLiked}
              initialIsSubscribed={isSubscribed}
              communityRating={communityRating}
            />
          ))
        )}
      </div>
    </>
  );
}
