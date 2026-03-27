from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_city'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='followers_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='user',
            name='following_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
