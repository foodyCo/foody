import sys

with open('/home/jeka/foodyFront/frontend/src/app/(main)/page.tsx', 'r') as f:
    text = f.read()

import_old = 'import { getSearchPosts } from "@/app/actions/post";'
import_new = 'import { getSearchPosts, getFollowingPosts } from "@/app/actions/post";'

text = text.replace(import_old, import_new)

fetch_old = """  let posts: any[] = [];
  try {
      posts = await getSearchPosts(undefined, undefined, accessToken);
  } catch (e: any) {"""

fetch_new = """  let posts: any[] = [];
  try {
      if (isFollowingTab && accessToken) {
          posts = await getFollowingPosts(accessToken);
      } else {
          posts = await getSearchPosts(undefined, undefined, accessToken);
      }
  } catch (e: any) {"""

text = text.replace(fetch_old, fetch_new)

filter_old = """  // Эмуляция вкладки "Подписки" (если мы просто фильтруем, то тут будет пусто)
  if (isFollowingTab) {
    dishes = dishes.filter((d: any) => d.isSubscribed);
  }"""

filter_new = """  // Для вкладки подписок теперь приходят реальные данные с бэкенда.
  // Можно считать, что для этих постов isSubscribed = true, т.к. они из ленты подписок.
  if (isFollowingTab) {
    dishes = dishes.map((d: any) => ({ ...d, isSubscribed: true }));
  }"""

text = text.replace(filter_old, filter_new)

with open('/home/jeka/foodyFront/frontend/src/app/(main)/page.tsx', 'w') as f:
    f.write(text)
