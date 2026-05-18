import sys
from io import BytesIO

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='Название тега')
    usage_count = models.PositiveIntegerField(default=0, db_index=True, verbose_name='Количество использований')

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True, verbose_name='Название категории')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

class Restaurant(models.Model):
    name = models.CharField(max_length=255, db_index=True, verbose_name='Название ресторана')
    address = models.CharField(max_length=100, verbose_name='Адрес')
    tags = models.ManyToManyField(Tag, through='RestaurantTag', related_name='restaurants', verbose_name='Теги ресторана')
    categories = models.ManyToManyField('Category', through='RestaurantCategory', related_name='restaurants', blank=True, verbose_name='Категории ресторана')

    class Meta:
        verbose_name = 'Ресторан'
        verbose_name_plural = 'Рестораны'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.address})"

class RestaurantCategory(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('restaurant', 'category')

class RestaurantTag(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('restaurant', 'tag')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class Dish(models.Model):
    name = models.CharField(max_length=50, db_index=True, verbose_name='Название блюда')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='dishes', verbose_name='Ресторан')
    tags = models.ManyToManyField(Tag, through='DishTag', related_name='dishes', verbose_name='Теги блюда')
    categories = models.ManyToManyField('Category', through='DishCategory', related_name='dishes', blank=True, verbose_name='Категории блюда')

    class Meta:
        verbose_name = 'Блюдо'
        verbose_name_plural = 'Блюда'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

class DishCategory(models.Model):
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('dish', 'category')

class DishTag(models.Model):
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('dish', 'tag')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class Post(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'На модерации'),
        (STATUS_APPROVED, 'Одобрен'),
        (STATUS_REJECTED, 'Отклонён'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='posts')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts', verbose_name='Ресторан')
    dish = models.ForeignKey(Dish, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts', verbose_name='Блюдо')

    description = models.TextField(verbose_name='Текст поста')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField(Tag, through='PostTag', related_name='posts', verbose_name='Теги')

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING,
        db_index=True, verbose_name='Статус модерации'
    )
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='moderated_posts', verbose_name='Модератор'
    )
    moderated_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата модерации')
    # Хранится для отправки в уведомлении через Celery (см. план на будущее)
    rejection_reason = models.TextField(null=True, blank=True, verbose_name='Причина отказа')

    class Meta:
        indexes = [
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'Пост'
        verbose_name_plural = 'Посты'

class PostTag(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'tag')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    # Используем ImageField для хранения на Я.Облаке (VM). DRF сериализатор
    # сам преобразует это в URL http://server_ip/media/post_images/...
    image = models.ImageField(upload_to='post_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def _strip_exif(self):
        """Пересохраняет изображение без EXIF-метаданных (включая GPS)."""
        if not self.image:
            return
        img = Image.open(self.image)
        fmt = img.format or 'JPEG'
        buf = BytesIO()
        save_kwargs = {'format': fmt, 'optimize': True}
        if fmt == 'JPEG':
            # JPEG не поддерживает прозрачность — конвертируем RGBA→RGB
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            save_kwargs['quality'] = 85
            save_kwargs['exif'] = b''
        elif fmt == 'PNG':
            save_kwargs['pnginfo'] = None
        elif fmt == 'WEBP':
            save_kwargs['quality'] = 85
        img.save(buf, **save_kwargs)
        buf.seek(0)
        content_type = Image.MIME.get(fmt, getattr(self.image.file, 'content_type', 'image/jpeg'))
        self.image = InMemoryUploadedFile(
            buf, 'ImageField', self.image.name, content_type,
            sys.getsizeof(buf), None,
        )

    def save(self, *args, **kwargs):
        # Стрипаем EXIF только при первом сохранении (pk ещё нет)
        if not self.pk and self.image:
            try:
                self._strip_exif()
            except Exception:
                pass  # не падаем на битых/неподдерживаемых файлах
        super().save(*args, **kwargs)

class PostStatistics(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name='statistics')
    
    rating = models.FloatField(default=0.0, verbose_name='Средняя оценка')
    
    likes_count = models.PositiveIntegerField(default=0, verbose_name='Количество лайков')
    saves_count = models.PositiveIntegerField(default=0, verbose_name='Количество сохранений')
    comments_count = models.PositiveIntegerField(default=0, verbose_name='Количество комментариев')

class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='liked_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # У уникальности с null=True в Postgres проблем нет: разные NULL не равны,
        # но так как юзеры удаляются, мы можем получить дубли NULL. Прагматично оставлять логи.
        unique_together = ('post', 'user')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class PostSave(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='saves')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='saved_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class PostReview(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='post_reviews')
    
    rating = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(settings.MAX_REVIEW_RATING)],
        verbose_name='Оценка',
        default=0.0
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', verbose_name='Пост')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='comments', verbose_name='Автор')
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Время публикации')

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Unknown'
        return f"Comment by {username} on {self.post}"
