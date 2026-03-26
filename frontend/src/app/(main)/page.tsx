import { auth } from "@/auth";
import FeedItem from "@/components/FeedItem";
import { getSearchPosts } from "@/app/actions/post";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth() as any;
  const accessToken = session?.user?.accessToken;

  let posts = [];
  try {
      posts = await getSearchPosts(undefined, undefined, accessToken);
  } catch (e: any) {
      if (e.message === "UNAUTHORIZED") {
          redirect("/login");
      }
      console.error("Failed to load posts", e);
  }

  const dishes = (posts || []).map((dish: any) => {
    return {
      dish,
      isLiked: dish.isLiked, // mapDjangoPostToDish ставит это поле
      isSubscribed: false,
      communityRating: dish.userRating
    }
  });

  return (
    <>
      <div className="feed" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-base)', maxWidth: '600px', margin: '0 auto', width: '100%', paddingTop: '120px', paddingBottom: '100px' }}>
        {dishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <p>Пока нет постов. Создайте первый пост!</p>
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
