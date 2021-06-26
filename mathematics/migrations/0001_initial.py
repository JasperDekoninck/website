# Generated by Django 3.1 on 2020-09-07 19:21

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('html_page', models.CharField(default='', max_length=255)),
                ('description', models.TextField()),
                ('image', models.ImageField(blank=True, default=None, upload_to='random_pics')),
            ],
        ),
    ]
