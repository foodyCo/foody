import bleach
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Follow


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT-сериализатор с логином по email вместо username."""
    username_field = User.EMAIL_FIELD

    def validate(self, attrs):
        # simplejwt ожидает username_field, передаём email
        attrs[self.username_field] = attrs.get(self.username_field, '').lower()
        return super().validate(attrs)

class UserSerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    # Явные ограничения: bio до 280 символов (UI лимит ставит 250, даём небольшой
    # запас). full_name / city — обязательно непустые при PATCH (allow_blank=False).
    bio_text = serializers.CharField(
        max_length=280, required=False, allow_blank=True, trim_whitespace=True,
    )
    full_name = serializers.CharField(
        max_length=120, required=False, allow_blank=False, trim_whitespace=True,
    )
    city = serializers.CharField(
        max_length=100, required=False, allow_blank=False, trim_whitespace=True,
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name', 'bio_text', 'avatar',
            'birth_date', 'city', 'date_joined', 'is_staff',
            'posts_count', 'followers_count', 'following_count', 'is_following',
        )
        read_only_fields = ('id', 'email', 'date_joined', 'is_staff', 'followers_count', 'following_count')

    def validate_bio_text(self, value):
        """Очищаем bio от HTML-тегов (defence-in-depth, помимо React escape)."""
        if not value:
            return ''
        return bleach.clean(value, tags=[], attributes={}, strip=True)

    def get_avatar(self, obj):
        """Возвращает относительный URL /media/... без хоста."""
        if not obj.avatar:
            return None
        return obj.avatar.url

    def get_posts_count(self, obj):
        return obj.posts.filter(status='approved').count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False


class FeedPostAuthorSerializer(serializers.ModelSerializer):
    """
    Легковесный сериализатор для отображения автора в ленте постов.
    Содержит только минимум данных для экономии трафика.
    """
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'avatar')

    def get_avatar(self, obj):
        """Возвращает относительный URL /media/... без хоста."""
        if not obj.avatar:
            return None
        return obj.avatar.url

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    city = serializers.CharField(required=True, allow_blank=False, max_length=100)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm', 'full_name', 'city')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            city=validated_data.get('city', '')
        )
        return user
