import sys

with open('/home/jeka/foodyFront/backend/users/serializers.py', 'r') as f:
    text = f.read()

text = text.replace("    followers_count = serializers.SerializerMethodField()", "    followers_count = serializers.SerializerMethodField()\n    following_count = serializers.SerializerMethodField()\n    is_following = serializers.SerializerMethodField()")

text = text.replace("'posts_count', 'followers_count', 'following_count'", "'posts_count', 'followers_count', 'following_count', 'is_following'")
text = text.replace("        return 0\n\n    def get_following_count(self, obj):\n        # Пока нет модели подписок, возвращаем заглушку или 0\n        return 0", """        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # We assume Follow model is imported
            return obj.followers.filter(follower=request.user).exists()
        return False
""")

with open('/home/jeka/foodyFront/backend/users/serializers.py', 'w') as f:
    f.write(text)

