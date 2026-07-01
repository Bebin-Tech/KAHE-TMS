from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_taskreport_activity_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserModulePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module', models.CharField(choices=[('dashboard', 'Dashboard'), ('tasks', 'Tasks'), ('completed_tasks', 'Completed Tasks'), ('reports', 'Reports'), ('settings', 'Settings'), ('user_management', 'User Management'), ('department_management', 'Department Management')], max_length=40)),
                ('can_view', models.BooleanField(default=False)),
                ('can_edit', models.BooleanField(default=False)),
                ('can_delete', models.BooleanField(default=False)),
                ('can_access', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='module_permissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['user__username', 'module'],
                'unique_together': {('user', 'module')},
            },
        ),
    ]
