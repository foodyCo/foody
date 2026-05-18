from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, RestaurantViewSet, DishViewSet, ModerationViewSet, CategoryViewSet, TagViewSet

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'dishes', DishViewSet, basename='dish')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'moderation', ModerationViewSet, basename='moderation')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]
