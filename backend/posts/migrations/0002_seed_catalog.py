"""
Засев каталога: кухни, форматы, блюда и привязка блюдо→кухни/форматы.

Данные взяты из словарей фронта (frontend/src/lib/categories.ts):
DISH_CATEGORIES, CUISINE_CATEGORIES, PLACE_CATEGORIES. Привязка блюдо→кухня/формат —
разумный дефолт, редактируется потом в админке (Posts → Блюда (каталог)).
"""
from django.db import migrations
from django.utils.text import slugify


# (name, emoji, is_popular)
CUISINES = [
    ("Азиатская", "🥢", True),
    ("Итальянская", "🍝", True),
    ("Русская", "🥟", True),
    ("Кавказская", "🫓", True),
    ("Американская", "🍔", True),
    ("Ближневосточная", "🧆", False),
    ("Мексиканская", "🌮", True),
    ("Французская", "🥐", True),
    ("Грузинская", "🥟", True),
    ("Японская", "🍣", False),
    ("Корейская", "🥘", False),
    ("Тайская", "🌶️", False),
]

FORMATS = [
    ("Фастфуд", "🍟", True),
    ("Кафе", "☕", True),
    ("Ресторан", "🍽️", True),
    ("Кофейня", "🥐", True),
    ("Пекарня", "🥖", False),
    ("Бар", "🍺", False),
    ("Пиццерия", "🍕", True),
    ("Суши-бар", "🍣", False),
    ("Столовая", "🥘", False),
    ("Стритфуд", "🌭", True),
    ("Десерты", "🍰", False),
    ("Паб", "🍻", False),
]

# (name, emoji, is_popular, [cuisines], [formats])
DISHES = [
    ("Пицца", "🍕", True, ["Итальянская"], ["Пиццерия", "Ресторан", "Фастфуд"]),
    ("Бургеры", "🍔", True, ["Американская"], ["Фастфуд", "Стритфуд"]),
    ("Сэндвичи", "🥪", True, ["Американская"], ["Фастфуд", "Кафе"]),
    ("Шаурма", "🌯", True, ["Ближневосточная"], ["Фастфуд", "Стритфуд"]),
    ("Суши и роллы", "🍣", True, ["Японская", "Азиатская"], ["Суши-бар", "Ресторан"]),
    ("Рамен", "🍜", True, ["Японская", "Азиатская"], ["Ресторан", "Кафе"]),
    ("Вок", "🥞", True, ["Азиатская", "Тайская"], ["Фастфуд", "Кафе"]),
    ("Паста", "🍝", True, ["Итальянская"], ["Ресторан", "Кафе"]),
    ("Тако", "🌮", False, ["Мексиканская"], ["Фастфуд", "Стритфуд"]),
    ("Том-ям", "🥣", False, ["Тайская", "Азиатская"], ["Ресторан"]),
    ("Поке", "🍚", False, ["Азиатская"], ["Кафе", "Фастфуд"]),
    ("Хачапури", "🫓", False, ["Грузинская", "Кавказская"], ["Ресторан", "Пекарня"]),
    ("Стейки", "🥩", False, ["Американская"], ["Ресторан"]),
    ("Чизкейк", "🍰", False, ["Американская"], ["Кофейня", "Десерты", "Пекарня"]),
]


def _slug(name):
    return slugify(name, allow_unicode=True)[:120]


def seed(apps, schema_editor):
    Cuisine = apps.get_model('posts', 'Cuisine')
    Format = apps.get_model('posts', 'Format')
    Dish = apps.get_model('posts', 'Dish')

    cuisine_by_name = {}
    for order, (name, emoji, popular) in enumerate(CUISINES):
        cuisine_by_name[name] = Cuisine.objects.create(
            name=name, slug=_slug(name), emoji=emoji, is_popular=popular, order=order
        )

    format_by_name = {}
    for order, (name, emoji, popular) in enumerate(FORMATS):
        format_by_name[name] = Format.objects.create(
            name=name, slug=_slug(name), emoji=emoji, is_popular=popular, order=order
        )

    for order, (name, emoji, popular, cuisines, formats) in enumerate(DISHES):
        dish = Dish.objects.create(
            name=name, slug=_slug(name), emoji=emoji, is_popular=popular, order=order
        )
        dish.cuisines.set([cuisine_by_name[c] for c in cuisines])
        dish.formats.set([format_by_name[f] for f in formats])


def unseed(apps, schema_editor):
    apps.get_model('posts', 'Dish').objects.all().delete()
    apps.get_model('posts', 'Cuisine').objects.all().delete()
    apps.get_model('posts', 'Format').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
