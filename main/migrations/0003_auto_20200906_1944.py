# Generated by Django 3.1 on 2020-09-06 17:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0002_auto_20200906_1937'),
    ]

    operations = [
        migrations.AlterField(
            model_name='news',
            name='image',
            field=models.ImageField(default='defaultNews.png', upload_to='news_pics'),
        ),
    ]
