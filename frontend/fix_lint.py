import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('.map(t => t.trim())', '.map((t: string) => t.trim())')
text = text.replace(".filter(t => t !== '' && !tags.includes(t));", ".filter((t: string) => t !== '' && !tags.includes(t));")

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'w') as f:
    f.write(text)

