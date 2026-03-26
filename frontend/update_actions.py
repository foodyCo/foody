import sys

with open('/home/jeka/foodyFront/frontend/src/app/actions/post.ts', 'a') as f:
    f.write('''
export async function getTags() {
    try {
        const data = await apiRequest("/tags/");
        return data?.results || data || [];
    } catch (error) {
        console.error("Fetch tags error:", error);
        return [];
    }
}

export async function getCategories() {
    try {
        const data = await apiRequest("/categories/");
        return data?.results || data || [];
    } catch (error) {
        console.error("Fetch categories error:", error);
        return [];
    }
}
''')
