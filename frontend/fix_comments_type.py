with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/CommentsSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("style={{ fill: c.isLiked ? 1 : 0, fontSize: '18px' }}", "style={{ fontVariationSettings: `\\'FILL\\' ${c.isLiked ? 1 : 0}`, fontSize: '18px' }}")

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/CommentsSection.tsx', 'w') as f:
    f.write(text)
