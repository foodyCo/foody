import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('const ratingScore = Number(dish.userRating || 0).toFixed(1);', 'const ratingScore = Math.round(dish.userRating || 0);')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/page.tsx', 'w') as f:
    f.write(text)
