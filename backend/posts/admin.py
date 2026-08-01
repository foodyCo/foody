from django.contrib import admin
from .models import Post, PostStatistics, PostLike, PostSave, PostReview, Cuisine, DishType, Category

class PostStatisticsInline(admin.StackedInline):
    model = PostStatistics
    readonly_fields = ('likes_count', 'saves_count', 'rating')
    can_delete = False

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'moderated_by', 'price', 'created_at')
    search_fields = ('description', 'user__username')
    list_filter = ('status', 'created_at')
    readonly_fields = ('moderated_by', 'moderated_at')
    inlines = [PostStatisticsInline]

admin.site.register(PostStatistics)
admin.site.register(PostLike)
admin.site.register(PostSave)
admin.site.register(PostReview)

@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(DishType)
class DishTypeAdmin(admin.ModelAdmin):
    """Справочник блюд: здесь админ задаёт маппинг блюдо → кухня + категория."""
    list_display = ('id', 'name', 'cuisine', 'category')
    list_filter = ('cuisine', 'category')
    search_fields = ('name',)
