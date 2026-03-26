import sys

with open('/home/jeka/foodyFront/frontend/src/app/actions/post.ts', 'r') as f:
    text = f.read()

new_func = """
export async function getFollowingPosts(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) {
            options.headers = {
                "Authorization": `Bearer ${accessToken}`
            };
        }
        
        const response = await apiRequest("/posts/following/", options);
        // Assuming your backend returns paginated results { results: [...] } or just an array
        const results = Array.isArray(response?.results) ? response.results : (Array.isArray(response) ? response : []);
        return results.map(mapDjangoPostToDish);
    } catch (error) {
        console.error("Search following posts error:", error);
        return [];
    }
}
"""

text += new_func

with open('/home/jeka/foodyFront/frontend/src/app/actions/post.ts', 'w') as f:
    f.write(text)

