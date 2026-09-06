import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_academiccalendarevent_import_source'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicCalendarImport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('batch_id', models.UUIDField(db_index=True, unique=True)),
                ('file_name', models.CharField(max_length=255)),
                ('academic_year', models.CharField(max_length=20)),
                ('layout', models.JSONField(default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='academic_calendar_imports', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_academic_calendar_imports', to=settings.AUTH_USER_MODEL)),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='academic_calendar_imports', to='core.department')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
