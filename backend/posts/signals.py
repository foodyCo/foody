from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.db.models import F
from .models import Post, PostLike, PostSave, PostStatistics, Comment, Tag, PostTag, RestaurantTag, DishTag
from .tasks import update_likes_count, update_saves_count, update_comments_count

@receiver(post_save, sender=Post)
def create_post_statistics(sender, instance, created, **kwargs):
    """
    Гарантирует, что у каждого поста есть объект статистики при создании.
    """
    if created:
        PostStatistics.objects.create(post=instance)

# Лайки
@receiver(post_save, sender=PostLike)
def on_like_created(sender, instance, created, **kwargs):
    if created:
        update_likes_count.delay(instance.post_id, increment=True)

@receiver(pre_delete, sender=PostLike)
def on_like_deleted(sender, instance, **kwargs):
    update_likes_count.delay(instance.post_id, increment=False)

# Сохранения
@receiver(post_save, sender=PostSave)
def on_save_created(sender, instance, created, **kwargs):
    if created:
        update_saves_count.delay(instance.post_id, increment=True)

@receiver(pre_delete, sender=PostSave)
def on_save_deleted(sender, instance, **kwargs):
    update_saves_count.delay(instance.post_id, increment=False)

# Комментарии
@receiver(post_save, sender=Comment)
def on_comment_created(sender, instance, created, **kwargs):
    if created:
        update_comments_count.delay(instance.post_id, increment=True)

@receiver(pre_delete, sender=Comment)
def on_comment_deleted(sender, instance, **kwargs):
    update_comments_count.delay(instance.post_id, increment=False)

# Теги (Атомарное обновление usage_count)
def atomic_update_tag_usage(tag_id, increment=True):
    # Используем F() для атомарного счетчика на стороне БД 
    # без риска Race Condition. 
    if increment:
        Tag.objects.filter(id=tag_id).update(usage_count=F('usage_count') + 1)
    else:
        Tag.objects.filter(id=tag_id, usage_count__gt=0).update(usage_count=F('usage_count') - 1)

@receiver(post_save, sender=PostTag)
@receiver(post_save, sender=RestaurantTag)
@receiver(post_save, sender=DishTag)
def on_tag_added(sender, instance, created, **kwargs):
    if created:
        atomic_update_tag_usage(instance.tag_id, increment=True)

@receiver(pre_delete, sender=PostTag)
@receiver(pre_delete, sender=RestaurantTag)
@receiver(pre_delete, sender=DishTag)
def on_tag_removed(sender, instance, **kwargs):
    atomic_update_tag_usage(instance.tag_id, increment=False)
