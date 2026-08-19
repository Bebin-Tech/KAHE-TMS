from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_note_add_notes_permission'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='reminder_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
