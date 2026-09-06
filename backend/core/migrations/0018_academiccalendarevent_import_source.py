from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_academiccalendarevent_notification_sent_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='academiccalendarevent',
            name='source',
            field=models.CharField(
                choices=[
                    ('MANUAL', 'Manual Entry'),
                    ('EXCEL_IMPORT', 'Excel Import'),
                ],
                default='MANUAL',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='academiccalendarevent',
            name='import_batch_id',
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='academiccalendarevent',
            name='import_file_name',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
