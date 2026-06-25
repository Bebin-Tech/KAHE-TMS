from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Count, Q
from .models import User, Department, Task, SubTask, Submission, Notification
from .serializers import (
    UserSerializer, CreateUserSerializer, DepartmentSerializer, TaskSerializer, 
    SubTaskSerializer, SubmissionSerializer, NotificationSerializer,
    MyTokenObtainPairSerializer
)


class IsAdminRole(permissions.BasePermission):
    """Only users with role='ADMIN' can access."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


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

    @action(detail=True, methods=['post'])
    def submit_to_dean(self, request, pk=None):
        """HOD submits the main task to the Dean."""
        task = self.get_object()
        task.status = 'SUBMITTED_DEAN'
        task.save()
        Notification.objects.create(user=task.created_by, message=f"Task '{task.title}' has been submitted for your review by HOD.")
        return Response({'status': 'submitted to dean'})

    @action(detail=True, methods=['post'])
    def approve_as_dean(self, request, pk=None):
        """Dean approves the task, marking it as COMPLETED."""
        task = self.get_object()
        task.status = 'COMPLETED'
        task.save()
        Notification.objects.create(user=task.assigned_to_hod, message=f"Task '{task.title}' has been officially approved by the Dean.")
        return Response({'status': 'completed'})

    @action(detail=True, methods=['post'])
    def reject_as_dean(self, request, pk=None):
        """Dean rejects the task, sending it back to the HOD."""
        task = self.get_object()
        feedback = request.data.get('feedback', 'No feedback provided.')
        task.status = 'REJECTED_DEAN'
        task.save()
        Notification.objects.create(user=task.assigned_to_hod, message=f"Task '{task.title}' was rejected by the Dean. Feedback: {feedback}")
        return Response({'status': 'rejected by dean'})


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.filter(is_active=True)
    serializer_class = SubTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        """Soft delete for subtasks."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit_to_hod(self, request, pk=None):
        """Faculty submits work to the HOD."""
        subtask = self.get_object()
        subtask.status = 'SUBMITTED'
        subtask.progress = 100
        subtask.save()
        Notification.objects.create(user=subtask.created_by, message=f"Subtask '{subtask.title}' has been submitted by Faculty.")
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'])
    def approve_by_hod(self, request, pk=None):
        """HOD approves faculty work."""
        subtask = self.get_object()
        subtask.status = 'APPROVED_HOD'
        subtask.save()
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
        Notification.objects.create(user=subtask.assigned_to, message=f"Your work on '{subtask.title}' was rejected by HOD. Feedback: {feedback}")
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        subtask = self.get_object()
        subtask.progress = request.data.get('progress', 0)
        if subtask.progress == 100:
            subtask.status = 'IN_PROGRESS' # Or stay assigned until explicit submit
        subtask.save()
        return Response({'status': 'progress updated'})


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]


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
