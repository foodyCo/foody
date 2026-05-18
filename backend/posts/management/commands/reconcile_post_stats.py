"""
Пересчёт PostStatistics.{likes,saves,comments}_count из реальных строк.

Нужен после bulk-операций, raw delete, или если signal'ы не успели отработать.
По умолчанию — dry-run, показывает дрифт. С --apply пишет в БД.

Запуск:
    docker compose exec backend python manage.py reconcile_post_stats           # dry-run
    docker compose exec backend python manage.py reconcile_post_stats --apply   # действительно поправить
"""
from django.core.management.base import BaseCommand
from django.db.models import Count

from posts.models import Post, PostStatistics


class Command(BaseCommand):
    help = "Reconcile PostStatistics counters with actual related-row counts."

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Actually update DB. Default: dry-run.')

    def handle(self, *args, **options):
        apply_changes = options['apply']
        stats_qs = PostStatistics.objects.select_related('post').annotate(
            actual_likes=Count('post__likes', distinct=True),
            actual_saves=Count('post__saves', distinct=True),
            actual_comments=Count('post__comments', distinct=True),
        )

        drift_total = 0
        for s in stats_qs:
            stored = (s.likes_count, s.saves_count, s.comments_count)
            actual = (s.actual_likes, s.actual_saves, s.actual_comments)
            if stored == actual:
                continue
            drift_total += 1
            self.stdout.write(
                f"  Post #{s.post_id} drift: stored={stored} actual={actual}"
            )
            if apply_changes:
                PostStatistics.objects.filter(pk=s.pk).update(
                    likes_count=s.actual_likes,
                    saves_count=s.actual_saves,
                    comments_count=s.actual_comments,
                )

        mode = "FIXED" if apply_changes else "DRIFT (dry-run, use --apply)"
        self.stdout.write(self.style.SUCCESS(
            f"\nTotal posts with drift: {drift_total}. Mode: {mode}."
        ))
