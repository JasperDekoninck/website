# Generated by Django 3.1 on 2020-09-11 19:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0004_auto_20200911_2106'),
    ]

    operations = [
        migrations.AddField(
            model_name='semiscore',
            name='used',
            field=models.BooleanField(default=False),
        ),
    ]
