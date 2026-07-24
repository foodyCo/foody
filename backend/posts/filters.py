import django_filters
from .models import Post


class PostFilterSet(django_filters.FilterSet):
    """
    FilterSet для постов. Поддерживает фильтрацию по:
    - блюду (dish_id — каталожное блюдо, можно несколько через запятую)
    - кухне (cuisine_id — через блюдо: dish.cuisines)
    - формату (format_id — через блюдо: dish.formats)
    - тегам-хэштегам (tag_id — числовой; tag_name — точное совпадение)
    - автору (author / user_id)
    - заведению (restaurant_id) и городу/адресу (city — icontains)
    - цене (price_min / price_max)
    """

    # ?dish_id=1 или ?dish_id=1,2,3 — OR-фильтрация по каталожным блюдам
    dish_id = django_filters.BaseInFilter(field_name='dish_id', lookup_expr='in')

    # ?cuisine_id=5 или ?cuisine_id=5,6 — через выбранное блюдо
    cuisine_id = django_filters.BaseInFilter(field_name='dish__cuisines__id', lookup_expr='in')

    # ?format_id=2 — через выбранное блюдо
    format_id = django_filters.BaseInFilter(field_name='dish__formats__id', lookup_expr='in')

    # ?tag_id=1 или ?tag_id=1,2,3 — OR-фильтрация по нескольким тегам
    tag_id = django_filters.BaseInFilter(field_name='tags__id', lookup_expr='in')

    # ?tags=1 — алиас для обратной совместимости (одиночный тег)
    tags = django_filters.NumberFilter(field_name='tags__id')

    # ?tag_name=том-ям — точное совпадение по имени тега (без учёта регистра)
    tag_name = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')

    # ?author=6 или ?user_id=6 — по автору
    author = django_filters.NumberFilter(field_name='user_id')
    user_id = django_filters.NumberFilter(field_name='user_id')
    user = django_filters.NumberFilter(field_name='user_id')

    # ?restaurant_id=1 — по заведению
    restaurant_id = django_filters.NumberFilter(field_name='restaurant_id')

    # ?city=Москва — по адресу заведения (icontains)
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
            'dish_id', 'cuisine_id', 'format_id',
            'tag_id', 'tags', 'tag_name',
            'author', 'user_id', 'user',
            'restaurant_id', 'city', 'price_min', 'price_max',
        ]

    @property
    def qs(self):
        # cuisine_id / format_id идут через M2M и могут давать дубли постов —
        # применяем distinct, только если такие фильтры реально заданы.
        parent = super().qs
        if self.form.cleaned_data.get('cuisine_id') or self.form.cleaned_data.get('format_id'):
            return parent.distinct()
        return parent
