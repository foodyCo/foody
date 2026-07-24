import sys
from io import BytesIO

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image


class Tag(models.Model):
    """Свободный хэштег (пользовательский). Ортогонален каталогу блюд/кухонь/форматов."""
    name = models.CharField(max_length=50, unique=True, verbose_name='Название тега')
    usage_count = models.PositiveIntegerField(default=0, db_index=True, verbose_name='Количество использований')

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# Каталог (управляется из админки, глобальный)
# ─────────────────────────────────────────────────────────────────────────────

class Cuisine(models.Model):
    """Кухня: Американская, Итальянская, Японская… Задаётся админом."""
    name = models.CharField(max_length=100, unique=True, verbose_name='Название кухни')
    slug = models.SlugField(max_length=120, unique=True, blank=True, verbose_name='Slug')
    emoji = models.CharField(max_length=8, blank=True, verbose_name='Эмодзи')
    is_popular = models.BooleanField(default=False, db_index=True, verbose_name='Популярная')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Кухня'
        verbose_name_plural = 'Кухни'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Format(models.Model):
    """Формат заведения/подачи: Фастфуд, Ресторан, Кофейня… Задаётся админом."""
    name = models.CharField(max_length=100, unique=True, verbose_name='Название формата')
    slug = models.SlugField(max_length=120, unique=True, blank=True, verbose_name='Slug')
    emoji = models.CharField(max_length=8, blank=True, verbose_name='Эмодзи')
    is_popular = models.BooleanField(default=False, db_index=True, verbose_name='Популярный')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Формат'
        verbose_name_plural = 'Форматы'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Dish(models.Model):
    """
    Блюдо (каталог): Бургеры, Пицца, Суши… Задаётся админом.
    Привязка блюдо→кухни/форматы настраивается здесь же. При создании поста
    пользователь выбирает блюдо, а кухни/форматы поста берутся из этой привязки.
    """
    name = models.CharField(max_length=100, unique=True, verbose_name='Название блюда')
    slug = models.SlugField(max_length=120, unique=True, blank=True, verbose_name='Slug')
    emoji = models.CharField(max_length=8, blank=True, verbose_name='Эмодзи')
    is_popular = models.BooleanField(default=False, db_index=True, verbose_name='Популярное')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    cuisines = models.ManyToManyField(
        Cuisine, blank=True, related_name='dishes', verbose_name='Кухни'
    )
    formats = models.ManyToManyField(
        Format, blank=True, related_name='dishes', verbose_name='Форматы'
    )

    class Meta:
        verbose_name = 'Блюдо (каталог)'
        verbose_name_plural = 'Блюда (каталог)'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# Заведение
# ─────────────────────────────────────────────────────────────────────────────

class Restaurant(models.Model):
    """Заведение. Привязано к картам (Яндекс): координаты + внешний id организации."""
    name = models.CharField(max_length=255, db_index=True, verbose_name='Название заведения')
    address = models.CharField(max_length=255, blank=True, verbose_name='Адрес')
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Широта'
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, verbose_name='Долгота'
    )
    yandex_place_id = models.CharField(
        max_length=64, blank=True, db_index=True, verbose_name='ID организации в Яндексе'
    )

    class Meta:
        verbose_name = 'Заведение'
        verbose_name_plural = 'Заведения'
        ordering = ['name']
        constraints = [
            # Один yandex_place_id — одно заведение. Пустая строка не участвует
            # в ограничении (заведения без привязки к карте дублировать можно).
            models.UniqueConstraint(
                fields=['yandex_place_id'],
                condition=~models.Q(yandex_place_id=''),
                name='uniq_yandex_place',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.address})" if self.address else self.name


# ─────────────────────────────────────────────────────────────────────────────
# Позиция: конкретное блюдо в конкретном заведении (полное название от юзера)
# ─────────────────────────────────────────────────────────────────────────────

class Position(models.Model):
    """
    Позиция — полное название блюда, которое ввёл пользователь при создании поста
    (например «Чизбургер Делюкс»), в контексте конкретного заведения. К одной позиции
    привязываются все посты с этим блюдом в этом заведении — это позволяет считать
    среднюю оценку позиции в заведении.
    """
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.CASCADE, related_name='positions', verbose_name='Заведение'
    )
    dish = models.ForeignKey(
        Dish, on_delete=models.PROTECT, related_name='positions', verbose_name='Блюдо (каталог)'
    )
    name = models.CharField(max_length=255, db_index=True, verbose_name='Название позиции')
    avg_rating = models.FloatField(default=0.0, verbose_name='Средняя оценка позиции')
    reviews_count = models.PositiveIntegerField(default=0, verbose_name='Количество отзывов')

    class Meta:
        verbose_name = 'Позиция'
        verbose_name_plural = 'Позиции'
        unique_together = ('restaurant', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} — {self.restaurant.name}"


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
    restaurant = models.ForeignKey(
        Restaurant, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='posts', verbose_name='Заведение'
    )
    position = models.ForeignKey(
        Position, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='posts', verbose_name='Позиция'
    )
    # Денормализация: post.dish == position.dish. Держим на посте, чтобы фильтры
    # поиска (кухня/формат/блюдо) шли на один join мельче.
    dish = models.ForeignKey(
        Dish, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='posts', verbose_name='Блюдо (каталог)'
    )

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


class CommentLike(models.Model):
    """Лайк на коммент. Зеркало PostLike."""
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='liked_comments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        username = self.user.username if self.user else 'Unknown'
        return f"CommentLike by {username} on comment {self.comment_id}"
