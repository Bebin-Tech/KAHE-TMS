from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_usermodulepermission'),
    ]

    operations = [
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note_date', models.DateField()),
                ('content', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-note_date', '-updated_at'],
            },
        ),
        migrations.AlterField(
            model_name='usermodulepermission',
            name='module',
            field=models.CharField(choices=[
                ('dashboard', 'Dashboard'),
                ('tasks', 'Tasks'),
                ('completed_tasks', 'Completed Tasks'),
                ('reports', 'Reports'),
                ('notes', 'Notes'),
                ('settings', 'Settings'),
                ('user_management', 'User Management'),
                ('department_management', 'Department Management'),
            ], max_length=40),
        ),
    ]
