"""
Пересчёт средней оценки позиций (Position.avg_rating / reviews_count) из отзывов.

Средняя оценка позиции = среднее по всем PostReview постов этой позиции
(конкретное блюдо в конкретном заведении).

Запуск: docker compose exec backend python manage.py recalc_position_ratings
"""
from django.core.management.base import BaseCommand

from posts.tasks import update_position_ratings


class Command(BaseCommand):
    help = "Recalculate Position.avg_rating / reviews_count from PostReview."

    def handle(self, *args, **options):
        result = update_position_ratings()
        self.stdout.write(self.style.SUCCESS(result))
