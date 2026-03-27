from celery import shared_task
from django.db.models import F


@shared_task
def update_followers_count(user_id, increment=True):
    from users.models import User
    if increment:
        User.objects.filter(id=user_id).update(followers_count=F('followers_count') + 1)
    else:
        User.objects.filter(id=user_id, followers_count__gt=0).update(followers_count=F('followers_count') - 1)


@shared_task
def update_following_count(user_id, increment=True):
    from users.models import User
    if increment:
        User.objects.filter(id=user_id).update(following_count=F('following_count') + 1)
    else:
        User.objects.filter(id=user_id, following_count__gt=0).update(following_count=F('following_count') - 1)
