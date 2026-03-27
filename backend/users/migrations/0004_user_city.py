from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_follow'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='city',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
