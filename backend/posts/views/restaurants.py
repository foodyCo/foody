from django.db.models import Count, Q
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Restaurant, Dish, Cuisine, Format, Position, Tag
from ..serializers import (
    RestaurantSerializer, DishSerializer, CuisineSerializer, FormatSerializer,
    PositionSerializer, TagSerializer,
)


class TagViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Справочник свободных тегов (хэштегов) — список и детальный просмотр (только чтение).
    Отдаётся без пагинации (тегов обычно десятки).
    """
    queryset = Tag.objects.all().order_by('-usage_count', 'name')
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [SearchFilter]
    search_fields = ['name']


class RestaurantViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Поиск и просмотр заведений (только чтение)."""
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]

    filter_backends = [SearchFilter]
    search_fields = ['name', 'address']
    ordering = ['name']


class _PopularMixin:
    """Общая ручка /popular/ для справочников каталога (кухни/форматы/блюда)."""
    popular_default_limit = 12

    def _limit(self, request):
        try:
            limit = int(request.query_params.get('limit', self.popular_default_limit))
        except (TypeError, ValueError):
            limit = self.popular_default_limit
        return max(1, min(limit, 50))

    @action(detail=False, methods=['get'], url_path='popular', permission_classes=[AllowAny])
    def popular(self, request):
        qs = self.filter_queryset(self.get_queryset()).filter(is_popular=True)[: self._limit(request)]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class CuisineViewSet(_PopularMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Справочник кухонь (только чтение). Управляется из админки."""
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [SearchFilter]
    search_fields = ['name']


class FormatViewSet(_PopularMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Справочник форматов (только чтение). Управляется из админки."""
    queryset = Format.objects.all()
    serializer_class = FormatSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [SearchFilter]
    search_fields = ['name']


class DishViewSet(_PopularMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Каталог блюд (только чтение). Каждое блюдо несёт привязанные кухни/форматы.
    Управляется из админки; используется на форме создания поста и в поиске.
    """
    serializer_class = DishSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['order', 'name']

    def get_queryset(self):
        qs = Dish.objects.prefetch_related('cuisines', 'formats').all()
        is_popular = self.request.query_params.get('is_popular')
        if is_popular in ('1', 'true', 'True'):
            qs = qs.filter(is_popular=True)
        return qs


class PositionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Позиции (конкретные блюда в конкретных заведениях). Только чтение.
    Обычно запрашивается с ?restaurant_id= для страницы заведения.
    """
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        qs = Position.objects.select_related('dish', 'restaurant').prefetch_related(
            'dish__cuisines', 'dish__formats'
        )
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        dish_id = self.request.query_params.get('dish_id')
        if dish_id:
            qs = qs.filter(dish_id=dish_id)
        return qs
