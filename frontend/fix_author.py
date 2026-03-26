import sys

with open('/home/jeka/foodyFront/frontend/src/components/AuthorSection.tsx', 'r') as f:
    orig = f.read()

text = orig.replace('import { toggleFollow } from "@/app/actions/social";', 'import { apiRequest } from "@/lib/api";')
text = text.replace("""        const res = await toggleFollow(author.id);
        if (res?.error) {
            setIsSubscribed(!newIsSubscribed);
        }""", """        try {
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
        }""")

with open('/home/jeka/foodyFront/frontend/src/components/AuthorSection.tsx', 'w') as f:
    f.write(text)

