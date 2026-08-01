"""Сидирование справочников кухонь, категорий и блюд (по ТЗ).

Идемпотентно: get_or_create по имени, повторный прогон ничего не дублирует.
"""
from django.db import migrations

CUISINES = [
    'Американская', 'Итальянская', 'Японская', 'Азиатская', 'Тайская',
    'Мексиканская', 'Грузинская', 'Русская', 'Французская',
]

CATEGORIES = [
    'Фастфуд', 'Супы', 'Салаты', 'Горячее', 'Стейки', 'Завтраки',
    'Выпечка', 'Десерты', 'Напитки', 'Другое',
]

# name -> (cuisine | None, category | None)
DISH_TYPES = {
    'Бургер': ('Американская', 'Фастфуд'),
    'Чизбургер': ('Американская', 'Фастфуд'),
    'Хот-дог': ('Американская', 'Фастфуд'),
    'Пицца': ('Итальянская', None),
    'Паста': ('Итальянская', 'Горячее'),
    'Суши и роллы': ('Японская', None),
    'Рамен': ('Японская', 'Супы'),
    'Том-ям': ('Тайская', 'Супы'),
    'Шаурма': (None, 'Фастфуд'),
    'Салат Цезарь': (None, 'Салаты'),
    'Чизкейк': (None, 'Десерты'),
}


def seed(apps, schema_editor):
    Cuisine = apps.get_model('posts', 'Cuisine')
    Category = apps.get_model('posts', 'Category')
    DishType = apps.get_model('posts', 'DishType')

    cuisines = {name: Cuisine.objects.get_or_create(name=name)[0] for name in CUISINES}
    categories = {name: Category.objects.get_or_create(name=name)[0] for name in CATEGORIES}

    for name, (cuisine_name, category_name) in DISH_TYPES.items():
        DishType.objects.get_or_create(
            name=name,
            defaults={
                'cuisine': cuisines.get(cuisine_name),
                'category': categories.get(category_name),
            },
        )


def unseed(apps, schema_editor):
    Cuisine = apps.get_model('posts', 'Cuisine')
    Category = apps.get_model('posts', 'Category')
    DishType = apps.get_model('posts', 'DishType')

    DishType.objects.filter(name__in=DISH_TYPES).delete()
    Cuisine.objects.filter(name__in=CUISINES).delete()
    Category.objects.filter(name__in=CATEGORIES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0018_cuisine_dishtype_post_dish_type'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
