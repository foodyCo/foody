"""
One-time data migration: recalculate followers_count / following_count
for all users from the actual rows in users_follow.
Safe to re-run — always produces correct results.
"""

from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model("users", "User")
    Follow = apps.get_model("users", "Follow")

    for user in User.objects.all():
        user.followers_count = Follow.objects.filter(following=user).count()
        user.following_count = Follow.objects.filter(follower=user).count()
        user.save(update_fields=["followers_count", "following_count"])


def backwards(apps, schema_editor):
    # noop — no safe way to "undo" a recalculation
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_user_follower_counts"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
