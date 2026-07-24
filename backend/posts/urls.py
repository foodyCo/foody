from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, RestaurantViewSet, DishViewSet, ModerationViewSet,
    CuisineViewSet, FormatViewSet, PositionViewSet, TagViewSet,
)
from .views.comment_likes import CommentLikeView, CommentLikesBatchView

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'dishes', DishViewSet, basename='dish')
router.register(r'cuisines', CuisineViewSet, basename='cuisine')
router.register(r'formats', FormatViewSet, basename='format')
router.register(r'positions', PositionViewSet, basename='position')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'moderation', ModerationViewSet, basename='moderation')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    # Стандалон-ручки для лайков на комменты — НЕ зависят от post_id (фронт
    # дёргает одной ручкой не зная PK поста).
    path('comments/likes/', CommentLikesBatchView.as_view(), name='comment-likes-batch'),
    path('comments/<int:comment_id>/like/', CommentLikeView.as_view(), name='comment-like'),
    path('', include(router.urls)),
]
