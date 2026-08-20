from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_note_reminder_enabled'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskreport',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
