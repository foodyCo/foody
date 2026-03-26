import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fixMediaUrl } from '@/lib/api';
import { getRestaurant, getRestaurantPosts } from '@/app/actions/post';
import { auth } from '@/auth';
import styles from './page.module.css';

export default async function RestaurantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth() as any;
  const token = session?.user?.accessToken as string | undefined;
  
  const { id } = await params;

  const [restaurant, postsRes] = await Promise.all([
    getRestaurant(id, token),
    getRestaurantPosts(id, token)
  ]);

  if (!restaurant) {
    notFound();
  }

  
  const posts = Array.isArray(postsRes?.results) ? postsRes.results : (Array.isArray(postsRes) ? postsRes : []);
  if (!restaurant) {
    notFound();
  }

  return (
    <>
      <div className={styles.ambientBg}></div>

      <div className={styles.profileContainer}>
        <header className={styles.profileHeaderTop}>
          <Link href="/" className={styles.backBtn}>
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg>
          </Link>
          <div className={styles.headerTitle}>Restaurant Dashboard</div>
          <button className={styles.backBtn} style={{visibility: 'hidden'}}>
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
        </header>

        <section className={styles.profileInfo}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar} />
          </div>

          <h1 className={styles.fullName}>{restaurant.name}</h1>
          
          <div className={styles.metaInfo}>
            <span className={styles.category}>
              {restaurant.categories?.[0]?.name || 'Ресторан'}
            </span>
            <span className={styles.dot}>•</span>
            <span className={styles.statusOpen}>Открыто (моки)</span>
          </div>

          <div className={styles.location}>
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"></path></svg>
            <span>{restaurant.address || 'Адрес не указан'}</span>
          </div>

          <p className={styles.bio}>
            Описание ресторана скоро появится. Добро пожаловать!
          </p>

          <div className={styles.actionButtons}>
            <button className={styles.primaryBtn}>Забронировать (Мок)</button>
            <button className={styles.secondaryBtn} title="Позвонить">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {posts.length > 0 ? (posts.reduce((acc: any, p: any) => acc + (p.user_rating || p.statistics?.rating || 0), 0) / posts.length).toFixed(1) : '5.0'}
                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
              </span>
              <span className={styles.statLabel}>Рейтинг</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{posts.length}</span>
              <span className={styles.statLabel}>Постов</span>
            </div>
          </div>
        </section>

        <div className={styles.tabsContainer}>
          <div className={`${styles.tab} ${styles.active}`}>Публикации</div>
        </div>

        <main className={styles.postsGrid}>
          {posts.map((post: any) => (
            <Link href={`/dish/${post.id}`} key={post.id} className={styles.gridItem}>
              {post.images && post.images.length > 0 ? (
                <Image 
                  src={fixMediaUrl(post.images[0].image)} 
                  alt={post.dish?.name || 'Блюдо'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div style={{width: '100%', height: '100%', background: '#eee'}} />
              )}
              <div className={styles.postRating}>
                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                <span>{Number(post.user_rating || post.statistics?.rating || 5.0).toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </main>
      </div>
    </>
  );
}
