import re

with open('/home/jeka/foodyFront/backend/posts/views/posts.py', 'r') as f:
    content = f.read()

# Add restaurant_id filter
new_chunk = """
        # для списков (list, user_posts, и т.д.): только одобренные посты
        qs = posts_queryset.filter(status=Post.STATUS_APPROVED).order_by('-created_at')
        
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)

        if hasattr(self, 'action') and self.action == 'list' and user.is_authenticated and not restaurant_id:
            qs = qs.exclude(user=user)
        return qs
"""

content = re.sub(
    r"# для списков \(list, user_posts.*?return qs",
    new_chunk.strip(),
    content,
    flags=re.DOTALL
)

with open('/home/jeka/foodyFront/backend/posts/views/posts.py', 'w') as f:
    f.write(content)
