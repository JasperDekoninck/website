# Generated by Django 3.1 on 2020-09-26 12:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0011_semiscore'),
    ]

    operations = [
        migrations.AlterField(
            model_name='score',
            name='cheated',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='score',
            name='creation_date',
            field=models.DateField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='score',
            name='exit_date',
            field=models.DateField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='score',
            name='token',
            field=models.CharField(default=None, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='semiscore',
            name='creation_date',
            field=models.DateField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='semiscore',
            name='exit_date',
            field=models.DateField(default=None, null=True),
        ),
        migrations.AlterField(
            model_name='semiscore',
            name='token_score',
            field=models.CharField(default=None, max_length=255, null=True),
        ),
    ]
