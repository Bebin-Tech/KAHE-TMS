from django.db import migrations


def backfill_task_reports(apps, schema_editor):
    Task = apps.get_model('core', 'Task')
    SubTask = apps.get_model('core', 'SubTask')
    Submission = apps.get_model('core', 'Submission')
    TaskReport = apps.get_model('core', 'TaskReport')

    for task in Task.objects.filter(is_active=True):
        TaskReport.objects.update_or_create(
            task=task,
            subtask=None,
            user=task.created_by,
            defaults={
                'role': 'DEAN',
                'assigned_by': task.created_by,
                'assigned_at': task.created_at,
                'work_completed_at': task.updated_at if task.status == 'COMPLETED' else None,
                'status': task.status,
            }
        )

        if task.assigned_to_hod:
            latest_task_submission = Submission.objects.filter(task=task).order_by('-submitted_at').first()
            TaskReport.objects.update_or_create(
                task=task,
                subtask=None,
                user=task.assigned_to_hod,
                defaults={
                    'role': 'HOD',
                    'assigned_by': task.created_by,
                    'assigned_at': task.created_at,
                    'work_started_at': task.start_date,
                    'work_completed_at': task.updated_at if task.status in ['SUBMITTED_DEAN', 'COMPLETED'] else None,
                    'submission_at': latest_task_submission.submitted_at if latest_task_submission else None,
                    'status': task.status,
                    'rejected_by': task.created_by if task.status == 'REJECTED_DEAN' else None,
                    'rejection_at': task.updated_at if task.status == 'REJECTED_DEAN' else None,
                    'rejection_reason': latest_task_submission.feedback if latest_task_submission and task.status == 'REJECTED_DEAN' else '',
                }
            )

    for subtask in SubTask.objects.filter(is_active=True).select_related('task', 'assigned_to', 'created_by'):
        latest_submission = Submission.objects.filter(subtask=subtask).order_by('-submitted_at').first()
        TaskReport.objects.update_or_create(
            task=subtask.task,
            subtask=subtask,
            user=subtask.assigned_to,
            defaults={
                'role': 'FACULTY',
                'assigned_by': subtask.created_by,
                'assigned_at': subtask.task.created_at,
                'work_started_at': subtask.task.start_date if subtask.progress > 0 else None,
                'work_completed_at': latest_submission.submitted_at if latest_submission and subtask.status in ['SUBMITTED', 'APPROVED_HOD', 'COMPLETED'] else None,
                'submission_at': latest_submission.submitted_at if latest_submission else None,
                'status': subtask.status,
                'rejected_by': subtask.created_by if subtask.status == 'REJECTED_HOD' else None,
                'rejection_at': latest_submission.submitted_at if latest_submission and subtask.status == 'REJECTED_HOD' else None,
                'rejection_reason': latest_submission.feedback if latest_submission and subtask.status == 'REJECTED_HOD' else '',
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_taskreport'),
    ]

    operations = [
        migrations.RunPython(backfill_task_reports, migrations.RunPython.noop),
    ]
