# Generated by Django 3.1 on 2020-09-26 19:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_auto_20200905_1634'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='email_confirmed',
        ),
    ]
