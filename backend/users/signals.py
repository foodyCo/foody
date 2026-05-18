from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from .models import Follow, User

# FO1: Счётчики подписок — синхронно через F()
# ВНИМАНИЕ: users/views.py (SubscribeView) также обновляет эти счётчики вручную.
# После подключения этих сигналов счётчики будут инкрементироваться ДВАЖДЫ.
# Другой агент должен убрать ручное F()-обновление из SubscribeView.

@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    if created:
        User.objects.filter(pk=instance.follower_id).update(following_count=F('following_count') + 1)
        User.objects.filter(pk=instance.following_id).update(followers_count=F('followers_count') + 1)


@receiver(post_delete, sender=Follow)
def follow_deleted(sender, instance, **kwargs):
    User.objects.filter(pk=instance.follower_id).update(following_count=F('following_count') - 1)
    User.objects.filter(pk=instance.following_id).update(followers_count=F('followers_count') - 1)
