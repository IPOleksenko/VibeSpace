# Generated by Django 5.1.7 on 2025-03-12 23:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat_messages', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='chatmessage',
            old_name='file',
            new_name='media',
        ),
    ]
