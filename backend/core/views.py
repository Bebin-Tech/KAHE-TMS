from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count, Q
from django.utils import timezone
from .models import User, Department, Task, SubTask, Submission, TaskReport, Notification
from .serializers import (
    UserSerializer, CreateUserSerializer, DepartmentSerializer, TaskSerializer, 
    SubTaskSerializer, SubmissionSerializer, TaskReportSerializer, NotificationSerializer,
    MyTokenObtainPairSerializer
)


class IsAdminRole(permissions.BasePermission):
    """Only users with role='ADMIN' can access."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


def upsert_task_report(task, user, role, status, subtask=None, assigned_by=None, **updates):
    if not user:
        return None

    defaults = {
        'role': role,
        'status': status,
        'assigned_by': assigned_by,
        'assigned_at': updates.pop('assigned_at', task.created_at or timezone.now()),
    }
    defaults.update({key: value for key, value in updates.items() if value is not None})
    report, _ = TaskReport.objects.update_or_create(
        task=task,
        subtask=subtask,
        user=user,
        defaults=defaults
    )
    return report


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(is_active=True)
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete for user accounts."""
        instance = self.get_object()
        if instance.role == 'ADMIN':
            return Response({'error': 'Cannot delete an Admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        # Read actions: any authenticated user (needed for profile / listing HODs)
        # Write actions: Admin only (except changing own password)
        if self.action in ['list', 'retrieve', 'me', 'hods', 'change_password']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def hods(self, request):
        hods = User.objects.filter(role='HOD')
        serializer = self.get_serializer(hods, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='create_user')
    def create_user(self, request):
        """Admin creates a new user account."""
        serializer = CreateUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.must_change_password = True
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='toggle_active')
    def toggle_active(self, request, pk=None):
        """Admin activates or deactivates a user."""
        user = self.get_object()
        if user.role == 'ADMIN':
            return Response({'error': 'Cannot deactivate an Admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'status': 'activated' if user.is_active else 'deactivated',
            'is_active': user.is_active,
            'user': UserSerializer(user).data
        })

    @action(detail=True, methods=['post'], url_path='reset_password')
    def reset_password(self, request, pk=None):
        """Admin resets a user's password."""
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.must_change_password = True
        user.save()
        return Response({'status': 'password_reset', 'message': f'Password reset for {user.username}.'})

    @action(detail=False, methods=['post'], url_path='change_password', permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """User changes their own password on first login."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # Verify old password
        if not user.check_password(old_password):
            return Response({'error': 'The current password you entered is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        if not new_password or len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if old_password == new_password:
            return Response({'error': 'New password cannot be the same as the old password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        return Response({'status': 'password_changed', 'message': 'Password updated successfully.'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard statistics for admin."""
        total = User.objects.count()
        active = User.objects.filter(is_active=True).count()
        inactive = User.objects.filter(is_active=False).count()
        role_counts = dict(User.objects.values_list('role').annotate(count=Count('id')).values_list('role', 'count'))
        dept_count = Department.objects.count()
        task_count = Task.objects.count()
        return Response({
            'total_users': total,
            'active_users': active,
            'inactive_users': inactive,
            'role_counts': role_counts,
            'departments': dept_count,
            'total_tasks': task_count,
        })


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.filter(is_active=True)
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_queryset = Task.objects.filter(is_active=True)
        if user.role == 'ADMIN':
            return base_queryset
        elif user.role == 'DEAN':
            return base_queryset.filter(created_by=user)
        elif user.role == 'HOD':
            return base_queryset.filter(assigned_to_hod=user)
        elif user.role == 'FACULTY':
            return base_queryset.filter(subtasks__assigned_to=user).distinct()
        return base_queryset

    def destroy(self, request, *args, **kwargs):
        """Soft delete for tasks."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        task_status = 'ASSIGNED' if serializer.validated_data.get('assigned_to_hod') else 'ONGOING'
        task = serializer.save(status=task_status)
        upsert_task_report(
            task=task,
            user=task.created_by,
            role='DEAN',
            status=task_status,
            assigned_by=task.created_by,
            assigned_at=task.created_at
        )
        if task.assigned_to_hod:
            upsert_task_report(
                task=task,
                user=task.assigned_to_hod,
                role='HOD',
                status='ASSIGNED',
                assigned_by=task.created_by,
                assigned_at=task.created_at
            )
            Notification.objects.create(
                user=task.assigned_to_hod,
                message=f"Task '{task.title}' has been assigned to you by the Dean."
            )

    def perform_update(self, serializer):
        task = serializer.save()
        now = timezone.now()
        upsert_task_report(
            task=task,
            user=task.created_by,
            role='DEAN',
            status=task.status,
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            work_completed_at=now if task.status == 'COMPLETED' else None
        )
        if task.assigned_to_hod:
            upsert_task_report(
                task=task,
                user=task.assigned_to_hod,
                role='HOD',
                status=task.status,
                assigned_by=task.created_by,
                assigned_at=task.created_at,
                work_started_at=now if task.status == 'IN_PROGRESS' else None,
                work_completed_at=now if task.status == 'SUBMITTED_DEAN' else None
            )

    @action(detail=True, methods=['post'])
    def submit_to_dean(self, request, pk=None):
        """HOD submits the main task to the Dean."""
        task = self.get_object()
        if request.user != task.assigned_to_hod and request.user.role not in ['ADMIN']:
            return Response({'error': 'Only the assigned HOD can submit this task.'}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content')
        if not content:
            approved_submissions = Submission.objects.filter(
                subtask__task=task,
                subtask__status__in=['APPROVED_HOD', 'COMPLETED']
            ).select_related('subtask', 'submitted_by').order_by('submitted_at')
            content_parts = [
                f"{submission.subtask.title}: {submission.content}"
                for submission in approved_submissions
            ]
            content = "\n\n".join(content_parts) or 'Completed task submitted by HOD for Dean review.'

        Submission.objects.create(
            task=task,
            submitted_by=request.user,
            content=content,
            attachment=request.FILES.get('attachment')
        )
        task.status = 'SUBMITTED_DEAN'
        task.save()
        upsert_task_report(
            task=task,
            user=task.assigned_to_hod,
            role='HOD',
            status='SUBMITTED_DEAN',
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            work_completed_at=timezone.now(),
            submission_at=timezone.now(),
            resubmission_at=timezone.now() if TaskReport.objects.filter(task=task, user=task.assigned_to_hod, rejection_at__isnull=False).exists() else None
        )
        upsert_task_report(
            task=task,
            user=task.created_by,
            role='DEAN',
            status='SUBMITTED_DEAN',
            assigned_by=task.created_by,
            assigned_at=task.created_at
        )
        Notification.objects.create(user=task.created_by, message=f"Task '{task.title}' has been submitted for your review by HOD.")
        return Response({'status': 'submitted to dean'})

    @action(detail=True, methods=['post'])
    def approve_as_dean(self, request, pk=None):
        """Dean approves the task, marking it as COMPLETED."""
        task = self.get_object()
        latest_submission = task.submissions.order_by('-submitted_at').first()
        if latest_submission:
            latest_submission.is_approved = True
            latest_submission.feedback = request.data.get('feedback', latest_submission.feedback)
            latest_submission.save()
        task.status = 'COMPLETED'
        task.save()
        now = timezone.now()
        upsert_task_report(
            task=task,
            user=task.created_by,
            role='DEAN',
            status='COMPLETED',
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            work_completed_at=now
        )
        upsert_task_report(
            task=task,
            user=task.assigned_to_hod,
            role='HOD',
            status='COMPLETED',
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            work_completed_at=now
        )
        Notification.objects.create(user=task.assigned_to_hod, message=f"Task '{task.title}' has been officially approved by the Dean.")
        return Response({'status': 'completed'})

    @action(detail=True, methods=['post'])
    def reject_as_dean(self, request, pk=None):
        """Dean rejects the task, sending it back to the HOD."""
        task = self.get_object()
        feedback = request.data.get('feedback', 'No feedback provided.')
        latest_submission = task.submissions.order_by('-submitted_at').first()
        if latest_submission:
            latest_submission.feedback = feedback
            latest_submission.is_approved = False
            latest_submission.save()
        task.status = 'REJECTED_DEAN'
        task.save()
        now = timezone.now()
        upsert_task_report(
            task=task,
            user=task.assigned_to_hod,
            role='HOD',
            status='REJECTED_DEAN',
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            rejected_by=request.user,
            rejection_at=now,
            rejection_reason=feedback
        )
        upsert_task_report(
            task=task,
            user=task.created_by,
            role='DEAN',
            status='REJECTED_DEAN',
            assigned_by=task.created_by,
            assigned_at=task.created_at,
            rejected_by=request.user,
            rejection_at=now,
            rejection_reason=feedback
        )
        Notification.objects.create(user=task.assigned_to_hod, message=f"Task '{task.title}' was rejected by the Dean. Feedback: {feedback}")
        return Response({'status': 'rejected by dean'})


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.filter(is_active=True)
    serializer_class = SubTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_queryset = SubTask.objects.filter(is_active=True)
        if user.role == 'ADMIN':
            return base_queryset
        if user.role == 'DEAN':
            return base_queryset.filter(task__created_by=user)
        if user.role == 'HOD':
            return base_queryset.filter(Q(created_by=user) | Q(task__assigned_to_hod=user)).distinct()
        if user.role == 'FACULTY':
            return base_queryset.filter(assigned_to=user)
        return base_queryset.none()

    def destroy(self, request, *args, **kwargs):
        """Soft delete for subtasks."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        subtask = serializer.save(created_by=self.request.user)
        upsert_task_report(
            task=subtask.task,
            subtask=subtask,
            user=subtask.assigned_to,
            role='FACULTY',
            status='ASSIGNED',
            assigned_by=self.request.user,
            assigned_at=timezone.now()
        )

    @action(detail=True, methods=['post'])
    def submit_to_hod(self, request, pk=None):
        """Faculty submits work to the HOD."""
        subtask = self.get_object()
        subtask.status = 'SUBMITTED'
        subtask.progress = 100
        subtask.save()
        now = timezone.now()
        upsert_task_report(
            task=subtask.task,
            subtask=subtask,
            user=subtask.assigned_to,
            role='FACULTY',
            status='SUBMITTED',
            assigned_by=subtask.created_by,
            assigned_at=subtask.report_entries.first().assigned_at if subtask.report_entries.exists() else now,
            work_completed_at=now,
            submission_at=now
        )
        Notification.objects.create(user=subtask.created_by, message=f"Subtask '{subtask.title}' has been submitted by Faculty.")
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'])
    def approve_by_hod(self, request, pk=None):
        """HOD approves faculty work."""
        subtask = self.get_object()
        subtask.status = 'APPROVED_HOD'
        subtask.progress = 100
        subtask.save()
        latest_submission = subtask.submissions.order_by('-submitted_at').first()
        if latest_submission:
            latest_submission.is_approved = True
            latest_submission.feedback = request.data.get('feedback', latest_submission.feedback)
            latest_submission.save()
        now = timezone.now()
        upsert_task_report(
            task=subtask.task,
            subtask=subtask,
            user=subtask.assigned_to,
            role='FACULTY',
            status='APPROVED_HOD',
            assigned_by=subtask.created_by,
            assigned_at=subtask.report_entries.first().assigned_at if subtask.report_entries.exists() else now,
            work_completed_at=now,
            submission_at=latest_submission.submitted_at if latest_submission else None
        )
        Notification.objects.create(user=subtask.assigned_to, message=f"Your work on '{subtask.title}' has been approved by HOD.")
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject_by_hod(self, request, pk=None):
        """HOD rejects faculty work and sends it back."""
        subtask = self.get_object()
        feedback = request.data.get('feedback', 'No feedback provided.')
        subtask.status = 'REJECTED_HOD'
        subtask.progress = 0
        subtask.save()
        latest_submission = subtask.submissions.order_by('-submitted_at').first()
        if latest_submission:
            latest_submission.feedback = feedback
            latest_submission.is_approved = False
            latest_submission.save()
        now = timezone.now()
        upsert_task_report(
            task=subtask.task,
            subtask=subtask,
            user=subtask.assigned_to,
            role='FACULTY',
            status='REJECTED_HOD',
            assigned_by=subtask.created_by,
            assigned_at=subtask.report_entries.first().assigned_at if subtask.report_entries.exists() else now,
            rejected_by=request.user,
            rejection_at=now,
            rejection_reason=feedback
        )
        Notification.objects.create(user=subtask.assigned_to, message=f"Your work on '{subtask.title}' was rejected by HOD. Feedback: {feedback}")
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        subtask = self.get_object()
        subtask.progress = request.data.get('progress', 0)
        if subtask.progress == 100:
            subtask.status = 'IN_PROGRESS' # Or stay assigned until explicit submit
        subtask.save()
        if int(subtask.progress) > 0:
            now = timezone.now()
            upsert_task_report(
                task=subtask.task,
                subtask=subtask,
                user=subtask.assigned_to,
                role='FACULTY',
                status='IN_PROGRESS',
                assigned_by=subtask.created_by,
                assigned_at=subtask.report_entries.first().assigned_at if subtask.report_entries.exists() else now,
                work_started_at=now
            )
        return Response({'status': 'progress updated'})


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Submission.objects.all()

        subtask_id = self.request.query_params.get('subtask')
        task_id = self.request.query_params.get('task')
        if subtask_id:
            queryset = queryset.filter(subtask_id=subtask_id)
        if task_id:
            queryset = queryset.filter(task_id=task_id)

        if user.role == 'ADMIN':
            return queryset
        if user.role == 'DEAN':
            return queryset.filter(Q(task__created_by=user) | Q(subtask__task__created_by=user)).distinct()
        if user.role == 'HOD':
            return queryset.filter(Q(task__assigned_to_hod=user) | Q(subtask__created_by=user) | Q(subtask__task__assigned_to_hod=user)).distinct()
        if user.role == 'FACULTY':
            return queryset.filter(submitted_by=user)
        return queryset.none()


class TaskReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TaskReport.objects.select_related('task', 'subtask', 'user', 'assigned_by', 'rejected_by', 'task__created_by', 'task__assigned_to_hod')
    serializer_class = TaskReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        if user.role == 'DEAN':
            queryset = queryset.filter(task__created_by=user)
        elif user.role == 'HOD':
            queryset = queryset.filter(task__assigned_to_hod=user)
        elif user.role == 'FACULTY':
            queryset = queryset.filter(user=user)
        elif user.role != 'ADMIN':
            queryset = queryset.none()

        task_name = self.request.query_params.get('task_name')
        dean = self.request.query_params.get('dean')
        hod = self.request.query_params.get('hod')
        faculty = self.request.query_params.get('faculty')
        report_status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if task_name:
            queryset = queryset.filter(task__title__icontains=task_name)
        if dean:
            queryset = queryset.filter(task__created_by_id=dean)
        if hod:
            queryset = queryset.filter(task__assigned_to_hod_id=hod)
        if faculty:
            queryset = queryset.filter(user_id=faculty, role='FACULTY')
        if report_status:
            queryset = queryset.filter(status=report_status)
        if date_from:
            queryset = queryset.filter(assigned_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(assigned_at__date__lte=date_to)

        return queryset


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        """Soft delete: set is_active to False instead of deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
