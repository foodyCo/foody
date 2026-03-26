with open('/home/jeka/foodyFront/frontend/src/app/(main)/friends/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('import { getFriendsPosts } from "@/app/actions/social";', 'import { getFollowingPosts as getFriendsPosts } from "@/app/actions/post";')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/friends/page.tsx', 'w') as f:
    f.write(text)
