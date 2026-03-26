import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('setTags(prev =>', 'setTags((prev: string[]) =>')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'w') as f:
    f.write(text)

