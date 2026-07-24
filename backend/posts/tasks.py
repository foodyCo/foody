import logging

from celery import shared_task
from django.db.models import Avg, Count
from django.db import transaction
from .models import PostReview, PostStatistics, Position

logger = logging.getLogger(__name__)


@shared_task
def update_position_ratings():
    """
    Пересчитывает среднюю оценку и число отзывов для всех позиций
    (средняя оценка позиции в конкретном заведении).
    """
    aggregates = (
        PostReview.objects
        .exclude(post__position__isnull=True)
        .values('post__position')
        .annotate(avg_rating=Avg('rating'), cnt=Count('id'))
    )

    positions_to_update = []
    with transaction.atomic():
        position_ids = [item['post__position'] for item in aggregates]
        existing = {p.id: p for p in Position.objects.filter(id__in=position_ids)}
        for item in aggregates:
            pos = existing.get(item['post__position'])
            if pos:
                pos.avg_rating = item['avg_rating'] or 0.0
                pos.reviews_count = item['cnt'] or 0
                positions_to_update.append(pos)
        if positions_to_update:
            Position.objects.bulk_update(positions_to_update, ['avg_rating', 'reviews_count'])

    logger.info('update_position_ratings: updated %d positions', len(positions_to_update))
    return f"Updated {len(positions_to_update)} position ratings."

@shared_task
def update_post_ratings():
    """
    Периодически собирает все измененные рейтинги и обновляет PostStatistics.
    В идеале мы бы хранили флаг "need_update" у статистики, чтобы не пересчитывать все подряд.
    Для старта мы просто пересчитаем все посты, у которых есть отзывы (при высокой 
    стабильной нагрузке лучше добавить поле last_recalculated).
    
    Эта задача будет запускаться через Celery Beat раз в N минут.
    """
    
    # Собираем данные обо всех постах, у которых есть отзывы
    # (Django ORM легко вычисляет среднее значение через агрегацию Group By: Object)
    
    post_averages = PostReview.objects.values('post').annotate(
        avg_rating=Avg('rating')
    )

    # Оптимизированное обновление через bulk_update, чтобы не делать 1 запрос на каждый пост
    stats_to_update = []

    with transaction.atomic():
        # Загружаем существующие статистики для обновляемых постов
        post_ids = [item['post'] for item in post_averages]
        existing_stats = {
            stat.post_id: stat for stat in PostStatistics.objects.filter(post_id__in=post_ids)
        }

        for item in post_averages:
            post_id = item['post']
            stat_obj = existing_stats.get(post_id)
            if stat_obj:
                stat_obj.rating = item['avg_rating'] or 0.0
                stats_to_update.append(stat_obj)

        if stats_to_update:
            PostStatistics.objects.bulk_update(
                stats_to_update,
                ['rating']
            )

    logger.info('update_post_ratings: updated %d post rating statistics', len(stats_to_update))
    return f"Updated {len(stats_to_update)} post rating statistics."

from django.db.models import F

@shared_task
def update_likes_count(post_id, increment=True):
    """
    Атомарно обновляет счетчик лайков через F().
    Это работает так же быстро, как триггер БД, 
    выполняя запрос: UPDATE poststatistics SET likes_count = likes_count +/- 1
    """
    if increment:
        PostStatistics.objects.filter(post_id=post_id).update(likes_count=F('likes_count') + 1)
    else:
        # Убедимся, что не уходим в минус
        PostStatistics.objects.filter(post_id=post_id, likes_count__gt=0).update(likes_count=F('likes_count') - 1)


@shared_task
def update_saves_count(post_id, increment=True):
    """
    Атомарно обновляет счетчик сохранений через F().
    """
    if increment:
        PostStatistics.objects.filter(post_id=post_id).update(saves_count=F('saves_count') + 1)
    else:
        PostStatistics.objects.filter(post_id=post_id, saves_count__gt=0).update(saves_count=F('saves_count') - 1)


@shared_task
def update_comments_count(post_id, increment=True):
    """
    Атомарно обновляет счетчик комментариев через F().
    """
    if increment:
        PostStatistics.objects.filter(post_id=post_id).update(comments_count=F('comments_count') + 1)
    else:
        PostStatistics.objects.filter(post_id=post_id, comments_count__gt=0).update(comments_count=F('comments_count') - 1)

