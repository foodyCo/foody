with open('/home/jeka/foodyFront/frontend/src/components/ProfileHeader.tsx', 'r') as f:
    text = f.read()

text = text.replace('toggleFollow(user.id)', 'toggleFollow(user.id.toString(), null as any)')

with open('/home/jeka/foodyFront/frontend/src/components/ProfileHeader.tsx', 'w') as f:
    f.write(text)
