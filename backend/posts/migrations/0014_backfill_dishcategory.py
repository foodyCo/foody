"""
Data migration: backfill posts_dishcategory based on dish names (keyword mapping).
Idempotent — uses get_or_create.
"""

import re

from django.db import migrations


def forwards(apps, schema_editor):
    Dish = apps.get_model("posts", "Dish")
    Category = apps.get_model("posts", "Category")
    DishCategory = apps.get_model("posts", "DishCategory")

    cat_by_name = {c.name.lower(): c for c in Category.objects.all()}

    # keyword_map: list of (compiled_regex, category_name_exact_as_in_db)
    # Order matters — first match wins (one dish → one category).
    keyword_map = [
        # Суши и роллы (id=4)
        (r"суши|ролл|сашими|нигири|маки|темпура", "Суши и роллы"),
        # Рамен (id=5)
        (r"рамен|рамэн", "Рамен"),
        # Азия (id=3) — прочая азиатская кухня
        (r"том\s*ям|удон|пад\s*тай|вок|дим\s*сам|фо\s*бо|баоцзы|лапша|соба|тофу|мисо", "Азия"),
        # Бургеры и фастфуд (id=1)
        (r"бургер|хот[\s-]?дог|наггетс|хот-дог|картофел|фри", "Бургеры и фастфуд"),
        # Пицца (id=2)
        (r"пицц", "Пицца"),
        # Кофейни (id=6)
        (r"кофе|капучино|латте|эспрессо|американо|флэт\s*уайт|раф|матча|какао|чай", "Кофейни"),
        # Завтраки (id=7)
        (r"завтрак|омлет|каша|панкейк|гранола|сырник|йогурт|яйц|тост|мюсли|акай|смузи", "Завтраки"),
        # Пекарни и десерты (id=8)
        (r"тирамису|круассан|эклер|чизкейк|торт|кекс|маффин|брауни|печень|пирог|выпечк|десерт|мороженое|сорбет|панна\s*котта|медовик|наполеон|пончик|донат", "Пекарни и десерты"),
        # Мясо и гриль (id=9)
        (r"стейк|рибай|антрекот|шашлык|барбекю|bbq|гриль|свинин|говядин|баранин|ребр", "Мясо и гриль"),
        # Бары и пабы (id=10)
        (r"пиво|эль|коктейл|виски|пинта|тапас|снэк|закуск", "Бары и пабы"),
        # ЗОЖ и Вег (id=11)
        (r"вег|тофу|киноа|зож|авокадо|хумус|фалафел|боул|смузи\s*боул|веган|вегетари", "ЗОЖ и Вег"),
        # Кавказ и Грузия (id=12)
        (r"хачапури|хинкали|шаурма|люля|сациви|лобио|аджика|лаваш|плов|пита", "Кавказ и Грузия"),
        # Поке и боулы (id=13)
        (r"поке|боул|bowl", "Поке и боулы"),
        # Альтернатива (id=14)
        (r"борщ|солянк|окрошк|щи|рассольник|уха|крем[\s-]?суп|бульон|суп", "Альтернатива"),
    ]
    compiled = [(re.compile(p, re.IGNORECASE), cat_name) for p, cat_name in keyword_map]

    for dish in Dish.objects.all():
        name_lower = dish.name.lower()
        for pattern, cat_name in compiled:
            if pattern.search(name_lower):
                cat = cat_by_name.get(cat_name.lower())
                if cat:
                    DishCategory.objects.get_or_create(dish=dish, category=cat)
                break  # одно блюдо → одна категория


def backwards(apps, schema_editor):
    DishCategory = apps.get_model("posts", "DishCategory")
    DishCategory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0013_category_dishcategory_dish_categories_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
