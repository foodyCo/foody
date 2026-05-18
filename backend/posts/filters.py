import django_filters
from django.db.models import Q
from .models import Post


class PostFilterSet(django_filters.FilterSet):
    """
    FilterSet для постов. Поддерживает фильтрацию по:
    - тегам (tag_id — числовой, можно несколько через запятую; tag_name — точное совпадение)
    - автору (author или user_id)
    - ресторану (restaurant_id)
    - категории (category_id — ищет по dish.categories и restaurant.categories)
    - городу / адресу (city — icontains)
    - цене (price_min / price_max)
    """

    # ?tag_id=1 или ?tag_id=1,2,3  — OR-фильтрация по нескольким тегам
    tag_id = django_filters.BaseInFilter(field_name='tags__id', lookup_expr='in')

    # ?tags=1 — алиас для обратной совместимости (одиночный тег)
    tags = django_filters.NumberFilter(field_name='tags__id')

    # ?tag_name=том-ям — точное совпадение по имени тега (без учёта регистра)
    tag_name = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')

    # ?author=6 или ?user_id=6 — по автору
    author = django_filters.NumberFilter(field_name='user_id')
    user_id = django_filters.NumberFilter(field_name='user_id')
    user = django_filters.NumberFilter(field_name='user_id')

    # ?restaurant_id=1 — по ресторану
    restaurant_id = django_filters.NumberFilter(field_name='restaurant_id')

    # ?category_id=5 — ищет по dish.categories ИЛИ restaurant.categories
    category_id = django_filters.NumberFilter(method='filter_by_category')

    # ?city=Москва — по адресу ресторана (icontains)
    city = django_filters.CharFilter(field_name='restaurant__address', lookup_expr='icontains')

    # ?price_min=100&price_max=500 — диапазон цен.
    # min_value=0 чтобы отрицательные значения отбивались 400-ой.
    price_min = django_filters.NumberFilter(
        field_name='price', lookup_expr='gte', min_value=0,
    )
    price_max = django_filters.NumberFilter(
        field_name='price', lookup_expr='lte', min_value=0,
    )

    class Meta:
        model = Post
        fields = [
            'tag_id', 'tags', 'tag_name',
            'author', 'user_id', 'user',
            'restaurant_id', 'category_id',
            'city', 'price_min', 'price_max',
        ]

    def filter_by_category(self, queryset, name, value):
        """Фильтрация по категории через dish или restaurant (OR-логика с distinct)."""
        return queryset.filter(
            Q(dish__categories__id=value) | Q(restaurant__categories__id=value)
        ).distinct()
