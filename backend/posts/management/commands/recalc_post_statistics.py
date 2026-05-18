from django.core.management.base import BaseCommand
from posts.models import Post, PostStatistics


class Command(BaseCommand):
    help = "Recalculate likes_count/saves_count/comments_count on PostStatistics"

    def handle(self, *args, **options):
        total = 0
        for stats in PostStatistics.objects.select_related('post').iterator():
            stats.likes_count = stats.post.likes.count()
            stats.saves_count = stats.post.saves.count()
            stats.comments_count = stats.post.comments.count()
            stats.save(update_fields=['likes_count', 'saves_count', 'comments_count'])
            total += 1

        count = PostStatistics.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Recalculated {total}/{count} stats rows"))
