import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('const rating = postData?.statistics?.rating_taste?.toFixed(1) || "0.0";', 'const rating = Math.round(postData?.user_rating || postData?.statistics?.rating || 0);')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/page.tsx', 'w') as f:
    f.write(text)
