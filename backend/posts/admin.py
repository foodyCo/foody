from django.contrib import admin

from .models import (
    Post, PostStatistics, PostLike, PostSave, PostReview,
    Cuisine, Format, Dish, Restaurant, Position, Tag,
)


# ─── Каталог ─────────────────────────────────────────────────────────────────

@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'is_popular', 'order')
    list_editable = ('is_popular', 'order')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Format)
class FormatAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'is_popular', 'order')
    list_editable = ('is_popular', 'order')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'is_popular', 'order')
    list_editable = ('is_popular', 'order')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    # Настройка привязки блюдо→кухни/форматы (то самое соотношение из ТЗ)
    filter_horizontal = ('cuisines', 'formats')


# ─── Заведения и позиции ─────────────────────────────────────────────────────

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'latitude', 'longitude', 'yandex_place_id')
    search_fields = ('name', 'address', 'yandex_place_id')
    fields = ('name', 'address', 'latitude', 'longitude', 'yandex_place_id')


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'dish', 'restaurant', 'avg_rating', 'reviews_count')
    list_filter = ('dish',)
    search_fields = ('name', 'restaurant__name')
    readonly_fields = ('avg_rating', 'reviews_count')
    autocomplete_fields = ('restaurant', 'dish')


# ─── Посты ───────────────────────────────────────────────────────────────────

class PostStatisticsInline(admin.StackedInline):
    model = PostStatistics
    readonly_fields = ('likes_count', 'saves_count', 'comments_count', 'rating')
    can_delete = False


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'restaurant', 'position', 'dish', 'status', 'price', 'created_at')
    search_fields = ('description', 'user__username', 'position__name', 'restaurant__name')
    list_filter = ('status', 'dish', 'created_at')
    readonly_fields = ('moderated_by', 'moderated_at')
    autocomplete_fields = ('restaurant', 'position', 'dish')
    inlines = [PostStatisticsInline]


admin.site.register(Tag)
admin.site.register(PostStatistics)
admin.site.register(PostLike)
admin.site.register(PostSave)
admin.site.register(PostReview)
