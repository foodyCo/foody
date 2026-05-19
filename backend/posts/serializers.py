import bleach
from django.db import transaction, IntegrityError
from django.conf import settings
from rest_framework import serializers
from .models import Post, PostImage, PostStatistics, Tag, PostTag, PostReview, Comment, CommentLike, Restaurant, Dish, Category
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

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class RestaurantSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'categories']

class DishSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Dish
        fields = ['id', 'name', 'restaurant', 'categories']

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
    dish_name = serializers.CharField(source='dish.name', read_only=True)
    # Категории для UI «Категория: Азия». Объединяем категории dish и restaurant
    # (одна и та же категория может быть привязана к обеим — на фронте OK дедуп
    # сам через id).
    categories = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True, allow_null=True, allow_blank=True)

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'restaurant', 'restaurant_name', 'dish', 'dish_name',
            'description', 'price', 'created_at', 'images', 'statistics',
            'tags', 'categories', 'is_liked', 'is_saved', 'status', 'rejection_reason'
        ]

    def get_categories(self, obj):
        cats = {}
        if obj.dish_id:
            for c in obj.dish.categories.all():
                cats[c.id] = {'id': c.id, 'name': c.name}
        if obj.restaurant_id:
            for c in obj.restaurant.categories.all():
                cats.setdefault(c.id, {'id': c.id, 'name': c.name})
        return list(cats.values())

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
    Сериализатор только для валидации данных при СОЗДАНИИ поста.
    """
    description = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, trim_whitespace=True
    )
    # Картинки передаются списком файлов (в form-data)
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
    rating = serializers.FloatField(write_only=True, min_value=0.0, max_value=settings.MAX_REVIEW_RATING, required=True)

    # Новые поля для динамического создания ресторанов и блюд
    dish_name = serializers.CharField(write_only=True, max_length=50)
    restaurant_id = serializers.IntegerField(write_only=True, required=False)
    restaurant_name = serializers.CharField(write_only=True, required=False, max_length=255)
    restaurant_address = serializers.CharField(write_only=True, required=False, max_length=100)

    class Meta:
        model = Post
        fields = [
            'id', 'dish_name', 'description', 'price', 'uploaded_images',
            'tags_list', 'rating',
            'restaurant_id', 'restaurant_name', 'restaurant_address'
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
        
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        tags_list = validated_data.pop('tags_list', [])
        rating = validated_data.pop('rating')

        # Данные ресторана и блюда
        restaurant_id = validated_data.pop('restaurant_id', None)
        restaurant_name = validated_data.pop('restaurant_name', None)
        restaurant_address = validated_data.pop('restaurant_address', '')
        dish_name = validated_data.pop('dish_name', None)

        if not dish_name:
            raise serializers.ValidationError({"dish_name": "Необходимо указать название блюда."})

        restaurant = None
        if restaurant_id:
            try:
                restaurant = Restaurant.objects.get(id=restaurant_id)
            except Restaurant.DoesNotExist:
                raise serializers.ValidationError({"restaurant_id": "Ресторан с таким ID не существует."})
        elif restaurant_name:
            # Нормализуем имя (strip) перед поиском/созданием, чтобы избежать дублей из-за пробелов
            clean_restaurant_name = restaurant_name.strip()
            # Идемпотентное создание: при конкурентных запросах с одинаковым именем
            # ловим IntegrityError из unique-constraint и делаем fetch повторно.
            try:
                with transaction.atomic():
                    restaurant, _ = Restaurant.objects.get_or_create(
                        name=clean_restaurant_name,
                        defaults={'address': restaurant_address}
                    )
            except IntegrityError:
                restaurant = Restaurant.objects.get(name=clean_restaurant_name)
        else:
            raise serializers.ValidationError({"restaurant": "Необходимо передать restaurant_id или restaurant_name."})

        # Ищем блюдо без учёта регистра (iexact), сохраняем оригинальный регистр при создании.
        # При гонке двух параллельных POST с одинаковым (restaurant, name) ловим IntegrityError
        # из unique_together и делаем повторный fetch.
        clean_dish_name = dish_name.strip()
        dish = Dish.objects.filter(restaurant=restaurant, name__iexact=clean_dish_name).first()
        if not dish:
            try:
                with transaction.atomic():
                    dish = Dish.objects.create(name=clean_dish_name, restaurant=restaurant)
            except IntegrityError:
                dish = Dish.objects.filter(
                    restaurant=restaurant, name__iexact=clean_dish_name
                ).first()
                if dish is None:
                    raise

        user = self.context['request'].user

        # Пост + изображения + теги + ревью создаём в одной транзакции:
        # если что-то упадёт в середине, не остаётся «половины» поста.
        with transaction.atomic():
            post = Post.objects.create(
                user=user,
                restaurant=restaurant,
                dish=dish,
                **validated_data
            )

            for image in uploaded_images:
                PostImage.objects.create(post=post, image=image)

            for tag_name in tags_list:
                tag_name = tag_name.strip().lower()
                if tag_name:
                    # Защита от гонок при создании тегов: то же самое — savepoint + fetch.
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

