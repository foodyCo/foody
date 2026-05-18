from django.core.management.base import BaseCommand
from users.models import User, Follow


class Command(BaseCommand):
    help = "Recalculate followers_count and following_count for all users"

    def handle(self, *args, **options):
        users = User.objects.all()
        updated = 0
        for u in users.iterator():
            real_followers = Follow.objects.filter(following=u).count()
            real_following = Follow.objects.filter(follower=u).count()
            if u.followers_count != real_followers or u.following_count != real_following:
                u.followers_count = real_followers
                u.following_count = real_following
                u.save(update_fields=['followers_count', 'following_count'])
                updated += 1

        total = users.count()
        self.stdout.write(self.style.SUCCESS(f"Updated {updated}/{total} users"))
