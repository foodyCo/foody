from django.db.models import Count, Q
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from ..models import Restaurant, Dish, Category, Tag, Cuisine, DishType, Post
from ..serializers import (
    RestaurantSerializer, DishSerializer, CategorySerializer, TagSerializer,
    CuisineSerializer, DishTypeSerializer, DishTypeWriteSerializer,
)


class TagViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    S1: Вьюсет для тегов — список и детальный просмотр (только чтение).
    Отдаётся без пагинации (тегов обычно мало — десятки, удобно забирать одним запросом).
    """
    queryset = Tag.objects.all().order_by('-usage_count', 'name')
    serializer_class = TagSerializer
    # Справочник тегов публичный — anon должен видеть теги для /search.
    permission_classes = [AllowAny]
    pagination_class = None  # справочник целиком — фронт сам решает сколько показать
    filter_backends = [SearchFilter]
    search_fields = ['name']


class RestaurantViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет для поиска и просмотра ресторанов (только чтение).
    S2: Добавлен RetrieveModelMixin — теперь GET /restaurants/{id}/ возвращает 200.
    """
    queryset = Restaurant.objects.prefetch_related('categories', 'tags').all()
    serializer_class = RestaurantSerializer
    # Каталог ресторанов публичный — без anon /restaurant/{id} страница пустая.
    permission_classes = [AllowAny]

    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['name']

class ReferenceBookViewSet(viewsets.ModelViewSet):
    """
    База для админских справочников (категории, кухни, блюда):
    чтение — публично (лента и фильтры доступны анониму),
    создание/изменение/удаление — только стаф.
    """
    filter_backends = [SearchFilter]
    search_fields = ['name']

    def get_permissions(self):
        # Чтение справочника категорий публично, изменение — только staff.
        if self.action in ['list', 'retrieve', 'popular']:
            return [AllowAny()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        """
        GET /api/v1/categories/popular/?limit=8
        Возвращает категории, отсортированные по количеству **approved постов**,
        связанных с категорией (через dish.categories ИЛИ restaurant.categories).
        Раньше формула считала просто привязки блюд+ресторанов — категория с
        одним заброшенным блюдом без активных постов могла обгонять активную.
        """
        try:
            limit = int(request.query_params.get('limit', 8))
        except (TypeError, ValueError):
            limit = 8
        limit = max(1, min(limit, 50))

        from django.db.models import Q
        # Approved посты, чьи dish ИЛИ restaurant привязаны к категории.
        # Считаем через distinct posts чтобы один пост с категорийным dish
        # И категорийным restaurant не считался дважды.
        qs = (
            Category.objects.annotate(
                usage=Count(
                    'dishes__posts',
                    filter=Q(dishes__posts__status='approved'),
                    distinct=True,
                ) + Count(
                    'restaurants__posts',
                    filter=Q(restaurants__posts__status='approved'),
                    distinct=True,
                )
            )
            .order_by('-usage', 'name')[:limit]
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class CategoryViewSet(ReferenceBookViewSet):
    """Справочник категорий еды (Фастфуд, Супы, Десерты…)."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer


class CuisineViewSet(ReferenceBookViewSet):
    """Справочник кухонь (Американская, Итальянская…)."""
    queryset = Cuisine.objects.all().order_by('name')
    serializer_class = CuisineSerializer


class DishTypeViewSet(ReferenceBookViewSet):
    """
    Справочник блюд с маппингом на кухню/категорию.
    Пользователь выбирает блюдо при создании поста; кухня и категория
    проставляются автоматически через это соответствие.
    """
    queryset = DishType.objects.select_related('cuisine', 'category').order_by('name')

    def get_permissions(self):
        # popular — тоже публичное чтение; базовый класс знает только list/retrieve
        if self.action == 'popular':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        # Чтение — с вложенными cuisine/category, staff-запись — по id
        if self.action in ['list', 'retrieve', 'popular']:
            return DishTypeSerializer
        return DishTypeWriteSerializer

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def popular(self, request):
        """Топ блюд по числу одобренных постов: /dish-types/popular/?limit=8"""
        try:
            limit = int(request.query_params.get('limit', 8))
        except ValueError:
            limit = 8
        limit = max(1, min(limit, 50))
        queryset = self.get_queryset().annotate(
            posts_count=Count('posts', filter=Q(posts__status=Post.STATUS_APPROVED))
        ).order_by('-posts_count', 'name')[:limit]
        return Response(DishTypeSerializer(queryset, many=True).data)


class DishViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет для подгрузки списка блюд ресторана (только чтение).
    """
    serializer_class = DishSerializer
    # Каталог блюд публичный (нужен для страницы ресторана anon-юзеру).
    permission_classes = [AllowAny]
    
    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        queryset = Dish.objects.all()
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        return queryset
