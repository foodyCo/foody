import sys

# 1. Update SubscribeButton.tsx
with open('/home/jeka/foodyFront/frontend/src/components/SubscribeButton.tsx', 'r') as f:
    sub_text = f.read()

sub_text = sub_text.replace("import { apiRequest } from '@/lib/api';", "import { toggleFollow } from '@/app/actions/social';\nimport { useRouter } from 'next/navigation';")

old_handle_sub = """    const handleSubscribe = async () => {
        if (!session) {
            // Can redirect to login, or show alert
            alert("Пожалуйста, войдите, чтобы подписаться.");
            return;
        }

        try {
            setLoading(true);
            const method = isFollowing ? "DELETE" : "POST";
            await apiRequest(`/users/${userId}/subscribe/`, {
                method,
                headers: {
                    "Authorization": `Bearer ${session.user.accessToken}`
                }
            });
            setIsFollowing(!isFollowing);
            setLoading(false);
        } catch (error) {
            console.error("Failed to toggle subscription:", error);
            setLoading(false);
        }
    };"""

new_handle_sub = """    const router = useRouter();

    const handleSubscribe = async () => {
        if (!session) {
            alert("Пожалуйста, войдите, чтобы подписаться.");
            return;
        }

        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing); // Optimistic UI update
        setLoading(true);

        const res = await toggleFollow(userId, isFollowing);
        if (res?.error) {
            setIsFollowing(!newIsFollowing); // Revert on error
            console.error("Failed to toggle subscription:", res.error);
        } else {
            router.refresh(); // Refresh page data to show new follower count
        }
        setLoading(false);
    };"""

sub_text = sub_text.replace(old_handle_sub, new_handle_sub)
with open('/home/jeka/foodyFront/frontend/src/components/SubscribeButton.tsx', 'w') as f:
    f.write(sub_text)

# 2. Update AuthorSection.tsx
with open('/home/jeka/foodyFront/frontend/src/components/AuthorSection.tsx', 'r') as f:
    auth_text = f.read()

auth_text = auth_text.replace("import { apiRequest } from \"@/lib/api\";", "import { toggleFollow } from \"@/app/actions/social\";")

old_handle_auth = """        // Optimistic update
        const newIsSubscribed = !isSubscribed;
        setIsSubscribed(newIsSubscribed);

        try {
            const method = isSubscribed ? "DELETE" : "POST";
            await apiRequest(`/users/${author.id}/subscribe/`, {
                method,
                headers: {
                    "Authorization": `Bearer ${session.user.accessToken}`
                }
            });
        } catch (e) {
            console.error("Failed to toggle follow", e);
            setIsSubscribed(!newIsSubscribed);
        }"""

new_handle_auth = """        // Optimistic update
        const newIsSubscribed = !isSubscribed;
        setIsSubscribed(newIsSubscribed);

        const res = await toggleFollow(author.id, isSubscribed);
        if (res?.error) {
            console.error("Failed to toggle follow", res.error);
            setIsSubscribed(!newIsSubscribed);
        } else {
            router.refresh();
        }"""

auth_text = auth_text.replace(old_handle_auth, new_handle_auth)
with open('/home/jeka/foodyFront/frontend/src/components/AuthorSection.tsx', 'w') as f:
    f.write(auth_text)

