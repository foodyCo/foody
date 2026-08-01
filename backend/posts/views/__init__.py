from .posts import BasePostViewSet
from .actions import PostActionsMixin
from .restaurants import (
    RestaurantViewSet, DishViewSet, CategoryViewSet, TagViewSet,
    CuisineViewSet, DishTypeViewSet,
)
from .moderation import ModerationViewSet

# Объединяем в итоговый ViewSet
class PostViewSet(PostActionsMixin, BasePostViewSet):
    pass
