# Generated by Django 3.1 on 2021-06-07 18:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('random_projects', '0004_auto_20200921_1754'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeatherProject',
            fields=[
                ('randomproject_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='random_projects.randomproject')),
            ],
            options={
                'abstract': False,
            },
            bases=('random_projects.randomproject',),
        ),
    ]
