from rest_framework import viewsets, mixins
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from ..models import Restaurant, Dish, Category
from ..serializers import RestaurantSerializer, DishSerializer, CategorySerializer

class RestaurantViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Вьюсет для поиска ресторанов (только чтение).
    """
    queryset = Restaurant.objects.all()
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
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]


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
