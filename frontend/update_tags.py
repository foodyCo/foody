import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'r') as f:
    text = f.read()

text = text.replace('onChange={(e) => setTagInput(e.target.value)}\n              onKeyDown={addTag}', 'onChange={handleTagInputChange}\n              onKeyDown={addTag}')

with open('/home/jeka/foodyFront/frontend/src/app/(main)/create/page.tsx', 'w') as f:
    f.write(text)

