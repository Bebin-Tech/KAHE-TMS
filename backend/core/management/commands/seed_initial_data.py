from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.models import Department, UserModulePermission


MODULES = [
    'dashboard',
    'tasks',
    'completed_tasks',
    'reports',
    'notes',
    'settings',
    'user_management',
    'department_management',
]


class Command(BaseCommand):
    help = 'Create required starter departments, users, and admin permissions.'

    def handle(self, *args, **options):
        User = get_user_model()

        cs_department, _ = Department.objects.get_or_create(
            name='B.Sc - cs (Artificial Intelligence and Data Science)',
            defaults={
                'block_name': 'S-BLOCK',
                'description': 'Computer Science with AI and Data Science',
                'is_active': True,
            },
        )
        Department.objects.get_or_create(
            name='B.Sc - Information Technology',
            defaults={
                'block_name': 'S-BLOCK',
                'description': 'Information Technology',
                'is_active': True,
            },
        )

        users = [
            {
                'username': 'admin@kahe.edu',
                'email': 'admin@kahe.edu',
                'password': 'admin@kahe',
                'role': 'ADMIN',
                'first_name': 'Bebin',
                'last_name': 'R',
                'department': None,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'username': 'dean@kahe.edu',
                'email': 'dean@kahe.edu',
                'password': 'admin123',
                'role': 'DEAN',
                'first_name': 'Dean',
                'last_name': '.',
                'department': None,
            },
            {
                'username': 'hod@kahe.edu',
                'email': 'hod@kahe.edu',
                'password': 'admin123',
                'role': 'HOD',
                'first_name': 'Anitha',
                'last_name': 'G',
                'department': cs_department,
            },
            {
                'username': 'faculty@kahe.edu',
                'email': 'faculty@kahe.edu',
                'password': 'admin123',
                'role': 'FACULTY',
                'first_name': 'Deepak',
                'last_name': 'R',
                'department': cs_department,
            },
        ]

        created_count = 0
        for data in users:
            password = data.pop('password')
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={**data, 'is_active': True, 'must_change_password': False},
            )
            if created:
                user.set_password(password)
                user.save()
                created_count += 1

            if user.role == 'ADMIN':
                for module in MODULES:
                    UserModulePermission.objects.update_or_create(
                        user=user,
                        module=module,
                        defaults={
                            'can_access': True,
                            'can_view': True,
                            'can_edit': True,
                            'can_delete': True,
                        },
                    )

        self.stdout.write(self.style.SUCCESS(f'Initial data ready. Created {created_count} user(s).'))
