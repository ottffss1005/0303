# Generated by Django 5.1.5 on 2025-03-04 14:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('analysis', '0002_remove_analysis_photo_alter_analysis_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='analysis',
            name='photoName',
        ),
        migrations.RemoveField(
            model_name='analysis',
            name='photoUrl',
        ),
        migrations.RemoveField(
            model_name='analysis',
            name='sns_api',
        ),
        migrations.RemoveField(
            model_name='analysis',
            name='uploadTime',
        ),
        migrations.RemoveField(
            model_name='analysis',
            name='user_id',
        ),
    ]
