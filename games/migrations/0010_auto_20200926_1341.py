# Generated by Django 3.1 on 2020-09-26 11:41

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0009_auto_20200926_1325'),
    ]

    operations = [
        migrations.AddField(
            model_name='initialscore',
            name='game_variant',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='games.gamevariant'),
        ),
        migrations.AddField(
            model_name='initialscore',
            name='used',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='initialscore',
            name='token',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='score',
            name='token',
            field=models.CharField(blank=True, default=None, max_length=255, null=True),
        ),
        migrations.DeleteModel(
            name='SemiScore',
        ),
    ]
