# Generated by Django 3.1 on 2020-09-11 19:04

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0002_auto_20200905_1348'),
    ]

    operations = [
        migrations.CreateModel(
            name='SemiScore',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.FloatField()),
                ('token', models.FloatField(default=None)),
                ('game_variant', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='games.gamevariant')),
            ],
        ),
    ]
