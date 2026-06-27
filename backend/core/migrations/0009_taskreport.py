from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_subtask_is_active'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('ADMIN', 'Admin'), ('DEAN', 'Dean'), ('HOD', 'HOD'), ('FACULTY', 'Faculty')], max_length=10)),
                ('assigned_at', models.DateTimeField()),
                ('work_started_at', models.DateTimeField(blank=True, null=True)),
                ('work_completed_at', models.DateTimeField(blank=True, null=True)),
                ('submission_at', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(max_length=20)),
                ('rejection_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True)),
                ('resubmission_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_report_entries', to=settings.AUTH_USER_MODEL)),
                ('rejected_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rejected_report_entries', to=settings.AUTH_USER_MODEL)),
                ('subtask', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='report_entries', to='core.subtask')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='report_entries', to='core.task')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_report_entries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-assigned_at', '-updated_at'],
            },
        ),
    ]
