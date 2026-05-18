from django.db.models import Count
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from ..models import Restaurant, Dish, Category, Tag
from ..serializers import RestaurantSerializer, DishSerializer, CategorySerializer, TagSerializer


class TagViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    S1: Вьюсет для тегов — список и детальный просмотр (только чтение).
    Отдаётся без пагинации (тегов обычно мало — десятки, удобно забирать одним запросом).
    """
    queryset = Tag.objects.all().order_by('-usage_count', 'name')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['name']

class CategoryViewSet(viewsets.ModelViewSet):
    """
    Категории для ресторанов и блюд.
    Чтение — для всех авторизованных. Создание/изменение/удаление — только стаф.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'popular']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        """
        GET /api/v1/categories/popular/?limit=8
        Возвращает категории, отсортированные по количеству связанных постов
        (через привязки блюд и ресторанов). Категории без активности уходят в конец.
        """
        try:
            limit = int(request.query_params.get('limit', 8))
        except (TypeError, ValueError):
            limit = 8
        limit = max(1, min(limit, 50))
        qs = (
            Category.objects.annotate(
                usage=Count('dishes', distinct=True) + Count('restaurants', distinct=True)
            )
            .order_by('-usage', 'name')[:limit]
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class DishViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет для подгрузки списка блюд ресторана (только чтение).
    """
    serializer_class = DishSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        queryset = Dish.objects.all()
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        return queryset
