import os

from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from django.db.models import F, Avg, Count
from .models import (
    Post, PostImage, PostLike, PostSave, PostStatistics, PostReview,
    Comment, Tag, PostTag, Position,
)


@receiver(post_save, sender=Post)
def create_post_statistics(sender, instance, created, **kwargs):
    """
    Гарантирует, что у каждого поста есть объект статистики при создании.
    """
    if created:
        PostStatistics.objects.create(post=instance)


# PA3: удаление файла с диска при удалении PostImage
@receiver(post_delete, sender=PostImage)
def delete_image_file_on_postimage_delete(sender, instance, **kwargs):
    if instance.image and hasattr(instance.image, 'path'):
        try:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        except (ValueError, OSError):
            pass  # gracefully skip if file missing or path resolution fails


# C1: Счётчики комментариев — синхронно через F(), без Celery
@receiver(post_save, sender=Comment)
def increment_comments_count(sender, instance, created, **kwargs):
    if created:
        PostStatistics.objects.filter(post_id=instance.post_id).update(
            comments_count=F('comments_count') + 1
        )


@receiver(post_delete, sender=Comment)
def decrement_comments_count(sender, instance, **kwargs):
    PostStatistics.objects.filter(post_id=instance.post_id, comments_count__gt=0).update(
        comments_count=F('comments_count') - 1
    )


# Лайки — синхронно через F(), без Celery
@receiver(post_save, sender=PostLike)
def on_like_created(sender, instance, created, **kwargs):
    if created:
        PostStatistics.objects.filter(post_id=instance.post_id).update(
            likes_count=F('likes_count') + 1
        )


@receiver(pre_delete, sender=PostLike)
def on_like_deleted(sender, instance, **kwargs):
    PostStatistics.objects.filter(post_id=instance.post_id, likes_count__gt=0).update(
        likes_count=F('likes_count') - 1
    )


# Сохранения — синхронно через F(), без Celery
@receiver(post_save, sender=PostSave)
def on_save_created(sender, instance, created, **kwargs):
    if created:
        PostStatistics.objects.filter(post_id=instance.post_id).update(
            saves_count=F('saves_count') + 1
        )


@receiver(pre_delete, sender=PostSave)
def on_save_deleted(sender, instance, **kwargs):
    PostStatistics.objects.filter(post_id=instance.post_id, saves_count__gt=0).update(
        saves_count=F('saves_count') - 1
    )

# Теги (Атомарное обновление usage_count)
def atomic_update_tag_usage(tag_id, increment=True):
    # Используем F() для атомарного счетчика на стороне БД 
    # без риска Race Condition. 
    if increment:
        Tag.objects.filter(id=tag_id).update(usage_count=F('usage_count') + 1)
    else:
        Tag.objects.filter(id=tag_id, usage_count__gt=0).update(usage_count=F('usage_count') - 1)

@receiver(post_save, sender=PostTag)
def on_tag_added(sender, instance, created, **kwargs):
    if created:
        atomic_update_tag_usage(instance.tag_id, increment=True)

@receiver(pre_delete, sender=PostTag)
def on_tag_removed(sender, instance, **kwargs):
    atomic_update_tag_usage(instance.tag_id, increment=False)


# Средняя оценка позиции в заведении: пересчитываем при изменении отзывов.
def recompute_position_rating(position_id):
    if not position_id:
        return
    agg = PostReview.objects.filter(post__position_id=position_id).aggregate(
        avg=Avg('rating'), cnt=Count('id')
    )
    Position.objects.filter(id=position_id).update(
        avg_rating=agg['avg'] or 0.0,
        reviews_count=agg['cnt'] or 0,
    )


@receiver(post_save, sender=PostReview)
def on_review_saved(sender, instance, **kwargs):
    position_id = Post.objects.filter(id=instance.post_id).values_list('position_id', flat=True).first()
    recompute_position_rating(position_id)


@receiver(post_delete, sender=PostReview)
def on_review_deleted(sender, instance, **kwargs):
    position_id = Post.objects.filter(id=instance.post_id).values_list('position_id', flat=True).first()
    recompute_position_rating(position_id)
