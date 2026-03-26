import sys

with open('/home/jeka/foodyFront/frontend/src/app/actions/social.ts', 'r') as f:
    text = f.read()

old_toggle = """export async function toggleFollow(userId: string | number) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) return { error: "Not authenticated" };

    try {
        // Мы уже создали эндпоинт POST/DELETE /users/{id}/subscribe/
        // Но чтобы знать, POST делать или DELETE, нам надо было бы передавать isFollowing.
        // Сейчас упростим: можно поменять реализацию подписки если нужно.
        // Пока просто попробуем POST, если уже подписан - сервер вернет 200, но для отписки надо реализовать иначе в компоненте, либо передавать стейт сюда.
        return { error: "Not implemented in this file" };
    } catch (e: any) {
        return { error: e.message };
    }
}"""

new_toggle = """export async function toggleFollow(userId: string | number, isFollowing: boolean) {
    const session = await auth() as any;
    if (!session?.user?.accessToken) return { error: "Not authenticated" };

    try {
        const method = isFollowing ? "DELETE" : "POST";
        await apiRequest(`/users/${userId}/subscribe/`, {
            method,
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`,
            },
        });
        
        // Wait 100ms for celery/db updates if any
        await new Promise(res => setTimeout(res, 100));

        revalidatePath(`/users/${userId}`);
        revalidatePath('/profile');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}"""

text = text.replace(old_toggle, new_toggle)
with open('/home/jeka/foodyFront/frontend/src/app/actions/social.ts', 'w') as f:
    f.write(text)

