from django.db import migrations, models


def backfill_activity_fields(apps, schema_editor):
    TaskReport = apps.get_model('core', 'TaskReport')

    action_map = {
        'ASSIGNED': 'Assigned task',
        'IN_PROGRESS': 'Worked on task',
        'SUBMITTED': 'Submitted work to HOD',
        'APPROVED_HOD': 'Faculty work approved by HOD',
        'SUBMITTED_DEAN': 'Submitted task to Dean',
        'REJECTED_HOD': 'Rejected by HOD',
        'REJECTED_DEAN': 'Rejected by Dean',
        'COMPLETED': 'Completed task',
    }

    for report in TaskReport.objects.all():
        if not report.action_performed:
            report.action_performed = action_map.get(report.status, report.status.replace('_', ' ').title())
        if not report.action_at:
            report.action_at = (
                report.submission_at
                or report.rejection_at
                or report.work_completed_at
                or report.work_started_at
                or report.assigned_at
                or report.created_at
            )
        report.save(update_fields=['action_performed', 'action_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_backfill_task_reports'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskreport',
            name='action_performed',
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name='taskreport',
            name='action_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterModelOptions(
            name='taskreport',
            options={'ordering': ['-action_at', '-assigned_at', '-updated_at']},
        ),
        migrations.RunPython(backfill_activity_fields, migrations.RunPython.noop),
    ]
