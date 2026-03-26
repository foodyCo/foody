import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/users/[id]/page.tsx', 'r') as f:
    orig = f.read()

text = orig.replace('<span>{dish.rating || "0.0"}</span>', '<span>{Math.round(dish.userRating || 0)}</span>')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/users/[id]/page.tsx', 'w') as f:
    f.write(text)

