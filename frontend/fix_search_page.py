with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('dish.author?.avatarUrl', 'dish.author?.avatar')
text = text.replace('dish.author?.name', 'dish.author?.username')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'w') as f:
    f.write(text)
