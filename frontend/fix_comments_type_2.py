with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/page.tsx', 'r') as f:
    text = f.read()

text = text.replace("style={{ fontSize: '14px', fill: 1 }}", "style={{ fontSize: '14px', fontVariationSettings: `'FILL' 1` }}")

with open('/home/jeka/foodyFront/frontend/src/app/(main)/dish/[id]/comments/page.tsx', 'w') as f:
    f.write(text)
