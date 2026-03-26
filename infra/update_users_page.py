import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/users/[id]/page.tsx', 'r') as f:
    text = f.read()

# Replace the fetching logic
fetch_old = """        const data = await apiRequest(`/posts/user_posts/?user_id=${id}`, options);
        posts = Array.isArray(data.results || data) 
            ? (data.results || data).map(mapDjangoPostToDish) 
            : [];

        const firstPost = Array.isArray(data.results || data) ? (data.results || data)[0] : null;
        
        userData = {
            id: id,
            name: firstPost?.user?.username || "Пользователь",
            handle: firstPost?.user?.username?.toLowerCase() || `user_${id}`,
            avatar: fixMediaUrl(firstPost?.user?.avatar) || "/default-avatar.svg",
            bio: "Заядлый кулинар. Обожаю исследовать новые места!", // Пока фейк данные, так как бэк не отдаёт
            location: "Неизвестно",
            stats: {
                posts: posts.length,
                followers: 0,
                following: 0
            }
        };"""

fetch_new = """        const [postsData, userProfile] = await Promise.all([
            apiRequest(`/posts/user_posts/?user_id=${id}`, options).catch(() => ({ results: [] })),
            apiRequest(`/users/${id}/`, options).catch(() => null)
        ]);

        posts = Array.isArray(postsData.results || postsData) 
            ? (postsData.results || postsData).map(mapDjangoPostToDish) 
            : [];

        userData = {
            id: id,
            name: userProfile?.full_name || userProfile?.username || "Пользователь",
            handle: userProfile?.username?.toLowerCase() || `user_${id}`,
            avatar: fixMediaUrl(userProfile?.avatar) || "/default-avatar.svg",
            bio: userProfile?.bio_text || "Заядлый кулинар. Обожаю исследовать новые места!",
            location: "Неизвестно",
            stats: {
                posts: userProfile?.posts_count || posts.length,
                followers: userProfile?.followers_count || 0,
                following: userProfile?.following_count || 0
            },
            is_following: userProfile?.is_following || false
        };"""

text = text.replace(fetch_old, fetch_new)

# Add import
if "import SubscribeButton" not in text:
    text = text.replace('import styles', 'import SubscribeButton from "@/components/SubscribeButton";\nimport styles')

# Replace the markup button
html_old = """                <button className={styles.editProfileBtn} style={{ background: 'var(--brand-green, #2ecc71)', color: 'white', border: 'none' }}>
                    Подписаться
                </button>"""

html_new = """                <SubscribeButton userId={id} initialIsFollowing={userData.is_following} session={session} />"""

text = text.replace(html_old, html_new)

with open('/home/jeka/foodyFront/frontend/src/app/(main)/users/[id]/page.tsx', 'w') as f:
    f.write(text)

