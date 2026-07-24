from .posts import BasePostViewSet
from .actions import PostActionsMixin
from .restaurants import (
    RestaurantViewSet, DishViewSet, CuisineViewSet, FormatViewSet,
    PositionViewSet, TagViewSet,
)
from .moderation import ModerationViewSet

# Объединяем в итоговый ViewSet
class PostViewSet(PostActionsMixin, BasePostViewSet):
    pass
