from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0017_alter_dish_unique_together'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cuisine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=100, unique=True, verbose_name='Название кухни')),
            ],
            options={
                'verbose_name': 'Кухня',
                'verbose_name_plural': 'Кухни',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='DishType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=100, unique=True, verbose_name='Название блюда')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dish_types', to='posts.category', verbose_name='Категория')),
                ('cuisine', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dish_types', to='posts.cuisine', verbose_name='Кухня')),
            ],
            options={
                'verbose_name': 'Тип блюда',
                'verbose_name_plural': 'Типы блюд',
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='post',
            name='dish_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='posts', to='posts.dishtype', verbose_name='Тип блюда'),
        ),
    ]
