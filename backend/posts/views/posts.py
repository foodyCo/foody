import logging

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend

from users.models import Follow

logger = logging.getLogger(__name__)
from ..models import Post, PostLike, PostSave
from ..serializers import PostListSerializer, PostCreateSerializer, PostUpdateSerializer
from ..pagination import StandardResultsPagePagination
from ..filters import PostFilterSet


class BasePostViewSet(viewsets.ModelViewSet):
    """
    CRUD Вьюсет для Постов.
    Отвечает за права доступа и роутинг. Конкретная валидация данных — в сериализаторах.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsPagePagination

    # Фильтрация, поиск, сортировка
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PostFilterSet
    search_fields = [
        'dish__name', 'restaurant__name',
        'dish__categories__name', 'restaurant__categories__name',
        'tags__name',  # S11: поиск по тегам
    ]
    ordering_fields = ['created_at', 'statistics__rating', 'statistics__likes_count', 'price']
    ordering = ['-created_at', '-id']  # S7: tie-breaker по id

    def get_queryset(self):
        """
        Возвращает базовый QuerySet для постов с оптимизацией N+1 запросов.
        Если пользователь авторизован, подгружает его лайки и сохранения.
        my_posts: показывает все посты автора (включая pending/rejected).
        Остальные list-действия: только одобренные посты.
        retrieve: обрабатывается отдельно в get_object() — владелец видит свои.
        """
        user = self.request.user
        posts_queryset = Post.objects.select_related(
            'user', 'statistics', 'restaurant', 'dish'
        ).prefetch_related('images', 'tags')
        if user.is_authenticated:
            posts_queryset = posts_queryset.prefetch_related(
                Prefetch('likes', queryset=PostLike.objects.filter(user=user), to_attr='prefetched_likes'),
                Prefetch('saves', queryset=PostSave.objects.filter(user=user), to_attr='prefetched_saves')
            )
        # my_posts: пользователь видит свои посты любого статуса
        if hasattr(self, 'action') and self.action == 'my_posts':
            return posts_queryset.order_by('-created_at', '-id')
        # все остальные list-действия: только одобренные посты
        # (retrieve использует get_object() который расширяет это правило для владельца)
        return posts_queryset.filter(status=Post.STATUS_APPROVED).order_by('-created_at', '-id')

    def get_serializer_class(self):
        """
        Определяет, какой сериализатор использовать в зависимости от выполняемого действия.
        Для чтения возвращает полный сериализатор, для записи - сериализатор создания.
        """
        # Для GET (list, retrieve, my_posts, saved_posts, user_posts, following, liked) возвращаем полный граф
        if self.action in ['list', 'retrieve', 'my_posts', 'saved_posts', 'user_posts', 'following', 'liked']:
            return PostListSerializer
        # Для POST, PUT, PATCH используем чисто валидационный сериализатор
        return PostCreateSerializer

    def get_object(self):
        """
        CR3 + M2: владелец поста может видеть свои pending/rejected посты.
        Публичный список (get_queryset) остаётся approved-only.
        Анонимный пользователь — только approved.
        """
        user = self.request.user
        # Строим queryset с учётом прав: approved для всех + свои любого статуса
        qs = Post.objects.select_related(
            'user', 'statistics', 'restaurant', 'dish'
        ).prefetch_related('images', 'tags')
        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch('likes', queryset=PostLike.objects.filter(user=user), to_attr='prefetched_likes'),
                Prefetch('saves', queryset=PostSave.objects.filter(user=user), to_attr='prefetched_saves')
            )
            qs = qs.filter(Q(status=Post.STATUS_APPROVED) | Q(user=user))
        else:
            qs = qs.filter(status=Post.STATUS_APPROVED)

        obj = get_object_or_404(qs, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        """
        CR1: переопределяем create() чтобы вернуть полный PostListSerializer вместо
        неполного PostCreateSerializer (у которого часть полей write_only).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        output = PostListSerializer(post, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        """
        Удаление постов (может только автор или стаф)
        """
        post = get_object_or_404(Post, pk=kwargs['pk'])
        if not request.user.is_staff and post.user != request.user:
            logger.warning('User %s tried to delete post %s owned by %s', request.user.id, post.id, post.user.id)
            return Response({'error': 'Нельзя удалить чужой пост'}, status=status.HTTP_403_FORBIDDEN)

        logger.info('Post %s deleted by user %s', post.id, request.user.id)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        """
        Автор может редактировать свой pending/rejected пост.
        После редактирования статус сбрасывается обратно в pending (пост уходит на повторную модерацию).
        """
        post = get_object_or_404(Post, pk=kwargs['pk'], user=request.user)
        serializer = PostUpdateSerializer(post, data=request.data, partial=True, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PostListSerializer(post, context=self.get_serializer_context()).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='my', url_name='my')
    def my_posts(self, request):
        """
        Возвращает список постов, созданных текущим авторизованным пользователем.
        Включает посты любого статуса (pending, rejected, approved).
        """
        user_posts_queryset = self.filter_queryset(self.get_queryset().filter(user=request.user))
        
        # Подключаем пагинацию. 
        # Если страница запрошена, но пуста, пагинатор сам вернет пустой массив.
        page = self.paginate_queryset(user_posts_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(user_posts_queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='saved', url_name='saved')
    def saved_posts(self, request):
        """
        Возвращает список постов, которые текущий пользователь добавил в сохраненное.
        Только одобренные посты (pending/rejected в сохраненные попасть не могут).
        """
        saved_posts_queryset = self.filter_queryset(self.get_queryset().filter(saves__user=request.user))
        
        page = self.paginate_queryset(saved_posts_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(saved_posts_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_name='user-posts')
    def user_posts(self, request):
        """
        Возвращает список постов конкретного пользователя по параметру user_id.
        Публичный (AllowAny) — anon видит approved-контент на чужом профиле.
        get_queryset для anon уже отфильтрует pending/rejected.
        """
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user_posts_queryset = self.filter_queryset(self.get_queryset().filter(user_id=user_id))
        
        page = self.paginate_queryset(target_user_posts_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(target_user_posts_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='following', url_name='following')
    def following(self, request):
        """
        Возвращает посты пользователей, на которых подписан текущий юзер.
        """
        followed_ids = Follow.objects.filter(follower=request.user).values('following_id')
        qs = self.filter_queryset(self.get_queryset().filter(user_id__in=followed_ids))

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='liked', url_name='liked')
    def liked(self, request):
        """
        L1: Возвращает список постов, которые текущий пользователь лайкнул.
        Только одобренные посты (approved).
        """
        liked_queryset = self.filter_queryset(self.get_queryset().filter(likes__user=request.user))

        page = self.paginate_queryset(liked_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(liked_queryset, many=True)
        return Response(serializer.data)

    # Логика действий (Лайки, Сохранения, Комментарии) находится в PostActionsMixin,
    # который подмешивается в итоговый PostViewSet в __init__.py.
