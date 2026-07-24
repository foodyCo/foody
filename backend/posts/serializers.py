import bleach
from django.db import transaction, IntegrityError
from django.conf import settings
from rest_framework import serializers
from .models import (
    Post, PostImage, PostStatistics, Tag, PostTag, PostReview, Comment, CommentLike,
    Restaurant, Dish, Cuisine, Format, Position,
)
from users.serializers import UserSerializer, FeedPostAuthorSerializer

# Разрешённые HTML-теги для комментариев: никаких (только plain text)
_COMMENT_ALLOWED_TAGS: list = []
_COMMENT_ALLOWED_ATTRS: dict = {}

# Лимит размера фото при загрузке (применяется к каждому файлу в uploaded_images)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def _sanitize_post_description(value):
    """Очищает HTML-теги из description поста, оставляет plain text. Защита от XSS."""
    if not value:
        return ''
    return bleach.clean(value, tags=[], attributes={}, strip=True)


def _validate_uploaded_image_size(image):
    """Поднимает ValidationError если файл больше MAX_IMAGE_SIZE."""
    if image.size > MAX_IMAGE_SIZE:
        raise serializers.ValidationError(
            f"Файл больше 10 MB. Ваш: {image.size / 1024 / 1024:.1f} MB"
        )
    return image


class PostImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ['id', 'image', 'uploaded_at']

    def get_image(self, obj):
        """Возвращает относительный URL /media/... без хоста."""
        if not obj.image:
            return None
        return obj.image.url


class PostStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostStatistics
        fields = ['likes_count', 'saves_count', 'comments_count', 'rating']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


# ─── Каталог ─────────────────────────────────────────────────────────────────

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name', 'slug', 'emoji', 'is_popular']


class FormatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Format
        fields = ['id', 'name', 'slug', 'emoji', 'is_popular']


class DishSerializer(serializers.ModelSerializer):
    """Каталожное блюдо с привязанными кухнями и форматами."""
    cuisines = CuisineSerializer(many=True, read_only=True)
    formats = FormatSerializer(many=True, read_only=True)

    class Meta:
        model = Dish
        fields = ['id', 'name', 'slug', 'emoji', 'is_popular', 'cuisines', 'formats']


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'yandex_place_id']


class PositionSerializer(serializers.ModelSerializer):
    dish = DishSerializer(read_only=True)

    class Meta:
        model = Position
        fields = ['id', 'name', 'restaurant', 'dish', 'avg_rating', 'reviews_count']


class CommentSerializer(serializers.ModelSerializer):
    user_detail = FeedPostAuthorSerializer(source='user', read_only=True)
    text = serializers.CharField(max_length=2000, trim_whitespace=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_detail', 'text', 'created_at', 'likes_count', 'is_liked']
        read_only_fields = ['user', 'created_at', 'likes_count', 'is_liked']

    def get_likes_count(self, obj):
        # Если viewset аннотировал — берём из аннотации, иначе fallback на count().
        annotated = getattr(obj, '_likes_count', None)
        if annotated is not None:
            return annotated
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        if not request or not request.user or not request.user.is_authenticated:
            return False
        annotated = getattr(obj, '_is_liked', None)
        if annotated is not None:
            return bool(annotated)
        return CommentLike.objects.filter(comment=obj, user=request.user).exists()

    def validate_text(self, value):
        """Очищаем HTML-теги, оставляем plain text. Защита от XSS."""
        cleaned = bleach.clean(
            value,
            tags=_COMMENT_ALLOWED_TAGS,
            attributes=_COMMENT_ALLOWED_ATTRS,
            strip=True,
        )
        if not cleaned.strip():
            raise serializers.ValidationError("Текст комментария не может быть пустым.")
        return cleaned


class PostListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для выдачи постов в ленте.
    Вкладываем пользователя, картинки и статистику для минимизации фронтенд-запросов.
    """
    user = FeedPostAuthorSerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    statistics = PostStatisticsSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_address = serializers.CharField(source='restaurant.address', read_only=True)
    restaurant_latitude = serializers.DecimalField(
        source='restaurant.latitude', max_digits=9, decimal_places=6, read_only=True
    )
    restaurant_longitude = serializers.DecimalField(
        source='restaurant.longitude', max_digits=9, decimal_places=6, read_only=True
    )
    # `dish_name` для обратной совместимости с фронтом = полное название позиции,
    # которое ввёл пользователь (например «Чизбургер Делюкс»).
    dish_name = serializers.CharField(source='position.name', read_only=True)
    # Каталожное блюдо (Бургеры) + производные кухни/форматы (через блюдо).
    dish = DishSerializer(read_only=True)
    cuisines = serializers.SerializerMethodField()
    formats = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True, allow_null=True, allow_blank=True)

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'restaurant', 'restaurant_name', 'restaurant_address',
            'restaurant_latitude', 'restaurant_longitude',
            'position', 'dish', 'dish_name', 'cuisines', 'formats',
            'description', 'price', 'created_at', 'images', 'statistics',
            'tags', 'is_liked', 'is_saved', 'status', 'rejection_reason'
        ]

    def get_cuisines(self, obj):
        if not obj.dish_id:
            return []
        return [{'id': c.id, 'name': c.name, 'emoji': c.emoji} for c in obj.dish.cuisines.all()]

    def get_formats(self, obj):
        if not obj.dish_id:
            return []
        return [{'id': f.id, 'name': f.name, 'emoji': f.emoji} for f in obj.dish.formats.all()]

    def get_position(self, obj):
        if not obj.position_id:
            return None
        return {
            'id': obj.position.id,
            'name': obj.position.name,
            'avg_rating': obj.position.avg_rating,
            'reviews_count': obj.position.reviews_count,
        }

    def get_is_liked(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            if hasattr(obj, 'prefetched_likes'):
                return any(like.user_id == user.id for like in obj.prefetched_likes)
            return obj.likes.filter(user=user).exists()
        return False

    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            if hasattr(obj, 'prefetched_saves'):
                return any(save.user_id == user.id for save in obj.prefetched_saves)
            return obj.saves.filter(user=user).exists()
        return False


class PostUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для редактирования поста. Позволяет менять description, price, теги
    и добавлять новые фотографии (append, не replace).
    """
    description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, trim_whitespace=True
    )
    tags_list = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Post
        fields = ['description', 'price', 'tags_list', 'uploaded_images']

    def validate_description(self, value):
        return _sanitize_post_description(value)

    def validate_uploaded_images(self, value):
        for image in value:
            _validate_uploaded_image_size(image)
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        tags_list = validated_data.pop('tags_list', None)
        uploaded_images = validated_data.pop('uploaded_images', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.status = Post.STATUS_PENDING
        instance.moderated_by = None
        instance.moderated_at = None
        instance.save()

        if tags_list is not None:
            instance.tags.through.objects.filter(post=instance).delete()
            for tag_name in tags_list:
                tag_name = tag_name.strip().lower()
                if tag_name:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    PostTag.objects.create(post=instance, tag=tag)

        # Добавляем новые фото (append); EXIF стрипается автоматически в PostImage.save()
        for image in uploaded_images:
            PostImage.objects.create(post=instance, image=image)

        return instance


class PostCreateSerializer(serializers.ModelSerializer):
    """
    Валидация и создание поста (новый структурный контракт).

    Пользователь выбирает блюдо из каталога (`dish_id`) и вводит полное название
    позиции (`position_name`). Заведение — существующее (`restaurant_id`) или новое
    (`restaurant_name` + опц. адрес/координаты/яндекс-id). Кухни/форматы поста НЕ
    хранятся — они выводятся через выбранное блюдо на чтении.
    """
    description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, trim_whitespace=True
    )
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    tags_list = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    rating = serializers.FloatField(
        write_only=True, min_value=0.0, max_value=settings.MAX_REVIEW_RATING, required=True
    )

    # Каталожное блюдо + название позиции
    dish_id = serializers.IntegerField(write_only=True)
    position_name = serializers.CharField(write_only=True, max_length=255)

    # Заведение: существующее или новое (+ геопривязка к Яндекс-картам)
    restaurant_id = serializers.IntegerField(write_only=True, required=False)
    restaurant_name = serializers.CharField(write_only=True, required=False, max_length=255)
    restaurant_address = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=255
    )
    restaurant_lat = serializers.DecimalField(
        write_only=True, required=False, allow_null=True, max_digits=9, decimal_places=6
    )
    restaurant_lng = serializers.DecimalField(
        write_only=True, required=False, allow_null=True, max_digits=9, decimal_places=6
    )
    restaurant_place_id = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=64
    )

    class Meta:
        model = Post
        fields = [
            'id', 'dish_id', 'position_name', 'description', 'price',
            'uploaded_images', 'tags_list', 'rating',
            'restaurant_id', 'restaurant_name', 'restaurant_address',
            'restaurant_lat', 'restaurant_lng', 'restaurant_place_id',
        ]

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Цена не может быть отрицательной.")
        return value

    def validate_description(self, value):
        return _sanitize_post_description(value)

    def validate_uploaded_images(self, value):
        for image in value:
            _validate_uploaded_image_size(image)
        return value

    def validate_position_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Название позиции не может быть пустым.")
        return cleaned

    def validate_dish_id(self, value):
        if not Dish.objects.filter(id=value).exists():
            raise serializers.ValidationError("Блюдо с таким ID не существует.")
        return value

    # ── Резолверы заведения / позиции ──

    def _resolve_restaurant(self, validated_data):
        restaurant_id = validated_data.pop('restaurant_id', None)
        restaurant_name = validated_data.pop('restaurant_name', None)
        restaurant_address = validated_data.pop('restaurant_address', '') or ''
        restaurant_lat = validated_data.pop('restaurant_lat', None)
        restaurant_lng = validated_data.pop('restaurant_lng', None)
        restaurant_place_id = (validated_data.pop('restaurant_place_id', '') or '').strip()

        if restaurant_id:
            try:
                return Restaurant.objects.get(id=restaurant_id)
            except Restaurant.DoesNotExist:
                raise serializers.ValidationError({"restaurant_id": "Заведение с таким ID не существует."})

        # Привязка к Яндекс-карте по внешнему id — самый надёжный ключ дедупликации.
        if restaurant_place_id:
            defaults = {
                'name': (restaurant_name or '').strip() or 'Без названия',
                'address': restaurant_address.strip(),
                'latitude': restaurant_lat,
                'longitude': restaurant_lng,
            }
            try:
                with transaction.atomic():
                    restaurant, _ = Restaurant.objects.get_or_create(
                        yandex_place_id=restaurant_place_id, defaults=defaults
                    )
            except IntegrityError:
                restaurant = Restaurant.objects.get(yandex_place_id=restaurant_place_id)
            return restaurant

        if restaurant_name:
            clean_name = restaurant_name.strip()
            defaults = {
                'address': restaurant_address.strip(),
                'latitude': restaurant_lat,
                'longitude': restaurant_lng,
            }
            try:
                with transaction.atomic():
                    restaurant, _ = Restaurant.objects.get_or_create(
                        name=clean_name, address=restaurant_address.strip(),
                        defaults=defaults,
                    )
            except IntegrityError:
                restaurant = Restaurant.objects.filter(
                    name=clean_name, address=restaurant_address.strip()
                ).first()
            return restaurant

        raise serializers.ValidationError(
            {"restaurant": "Передайте restaurant_id, либо restaurant_name/restaurant_place_id."}
        )

    def _resolve_position(self, restaurant, dish, position_name):
        """
        Позиция уникальна в рамках заведения по имени. При гонке двух параллельных
        POST с одинаковым (restaurant, name) ловим IntegrityError из unique_together.
        """
        position = Position.objects.filter(
            restaurant=restaurant, name__iexact=position_name
        ).first()
        if position:
            return position
        try:
            with transaction.atomic():
                return Position.objects.create(
                    restaurant=restaurant, dish=dish, name=position_name
                )
        except IntegrityError:
            position = Position.objects.filter(
                restaurant=restaurant, name__iexact=position_name
            ).first()
            if position is None:
                raise
            return position

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        tags_list = validated_data.pop('tags_list', [])
        rating = validated_data.pop('rating')
        dish_id = validated_data.pop('dish_id')
        position_name = validated_data.pop('position_name')

        dish = Dish.objects.get(id=dish_id)
        restaurant = self._resolve_restaurant(validated_data)
        position = self._resolve_position(restaurant, dish, position_name)

        user = self.context['request'].user

        # Пост + изображения + теги + ревью создаём в одной транзакции:
        # если что-то упадёт в середине, не остаётся «половины» поста.
        with transaction.atomic():
            post = Post.objects.create(
                user=user,
                restaurant=restaurant,
                position=position,
                dish=position.dish,
                **validated_data
            )

            for image in uploaded_images:
                PostImage.objects.create(post=post, image=image)

            for tag_name in tags_list:
                tag_name = tag_name.strip().lower()
                if tag_name:
                    # Защита от гонок при создании тегов: savepoint + fetch.
                    try:
                        with transaction.atomic():
                            tag, _ = Tag.objects.get_or_create(name=tag_name)
                    except IntegrityError:
                        tag = Tag.objects.get(name=tag_name)
                    PostTag.objects.create(post=post, tag=tag)

            PostReview.objects.create(
                post=post,
                user=user,
                rating=rating
            )

        return post
