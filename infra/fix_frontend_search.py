import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''onClick={() => setSearchQuery(tag.name)}>
                                            <span>#</span>{tag.name}''',
    '''onClick={() => {
                                            setSearchQuery(`#${tag.name}`);
                                            setIsFocused(true);
                                        }}>
                                            <span>#</span>{tag.name}'''
)

content = content.replace(
    '''onClick={() => setSearchQuery(cat.name)}>''',
    '''onClick={() => {
                                            setSearchQuery(cat.name);
                                            setIsFocused(true);
                                        }}>'''
)

with open('/home/jeka/foodyFront/frontend/src/app/(main)/search/page.tsx', 'w') as f:
    f.write(content)
