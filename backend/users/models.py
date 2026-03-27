from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    bio_text = models.TextField(blank=True)
    # Картинки будут храниться на сервере (Яндекс Облако ВМ), 
    # DRF автоматически подставит абсолютный URL до картинки (http://ваш-домен/media/...)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    city = models.CharField(max_length=100, blank=True)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)

    # Optional: If you want email to be the default login field instead of username,
    # uncomment these lines:
    # USERNAME_FIELD = 'email'
    # REQUIRED_FIELDS = ['username']

    class Meta:
        indexes = [
            models.Index(fields=['-date_joined']),
        ]


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
