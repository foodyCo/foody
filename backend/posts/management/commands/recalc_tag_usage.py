"""
Пересчёт Tag.usage_count из реальных M2M-связей.

Нужен после миграций или если signals не успели отработать на исторических данных.
Считаем: каждый Tag.usage_count = число постов, где он привязан.

Запуск: docker compose exec backend python manage.py recalc_tag_usage
"""
from django.core.management.base import BaseCommand
from django.db.models import Count

from posts.models import Tag


class Command(BaseCommand):
    help = "Recalculate Tag.usage_count from actual M2M relations."

    def handle(self, *args, **options):
        tags = Tag.objects.annotate(
            posts_cnt=Count("posts", distinct=True),
        )
        updated = 0
        for tag in tags:
            new_value = tag.posts_cnt
            if tag.usage_count != new_value:
                Tag.objects.filter(pk=tag.pk).update(usage_count=new_value)
                self.stdout.write(
                    f"  Tag #{tag.pk} '{tag.name}': {tag.usage_count} -> {new_value}"
                )
                updated += 1
        self.stdout.write(
            self.style.SUCCESS(f"Updated {updated}/{tags.count()} tags.")
        )
