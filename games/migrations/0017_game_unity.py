# Generated by Django 3.1 on 2021-06-19 20:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0016_auto_20210619_2005'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='unity',
            field=models.BooleanField(default=False),
        ),
    ]
