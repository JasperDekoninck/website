# Generated by Django 3.1 on 2021-06-17 08:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0012_news_inactive'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='news',
            name='thought',
        ),
    ]
