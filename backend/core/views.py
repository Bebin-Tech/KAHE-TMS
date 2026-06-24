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
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # Read actions: any authenticated user (needed for profile / listing HODs)
        # Write actions: Admin only
        if self.action in ['list', 'retrieve', 'me', 'hods']:
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

    @action(detail=False, methods=['post'], url_path='change_password')
    def change_password(self, request):
        """User changes their own password on first login."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        return Response({'status': 'password_changed', 'message': 'Password changed successfully.'})

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
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Task.objects.all()
        elif user.role == 'DEAN':
            return Task.objects.filter(created_by=user)
        elif user.role == 'HOD':
            return Task.objects.filter(assigned_to_hod=user)
        elif user.role == 'FACULTY':
            return Task.objects.filter(subtasks__assigned_to=user).distinct()
        return Task.objects.all()

    @action(detail=True, methods=['post'])
    def approve_as_hod(self, request, pk=None):
        task = self.get_object()
        task.status = 'HOD_APPROVED'
        task.save()
        Notification.objects.create(user=task.created_by, message=f"Task '{task.title}' approved by HOD.")
        return Response({'status': 'approved by hod'})

    @action(detail=True, methods=['post'])
    def approve_as_dean(self, request, pk=None):
        task = self.get_object()
        task.status = 'COMPLETED'
        task.save()
        return Response({'status': 'completed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        task = self.get_object()
        feedback = request.data.get('feedback', '')
        if request.user.role == 'DEAN':
            task.status = 'REJECTED_DEAN'
            Notification.objects.create(user=task.assigned_to_hod, message=f"Task '{task.title}' rejected by Dean: {feedback}")
        else:
            task.status = 'REJECTED_HOD'
            # Find subtasks and notify faculty?
        task.save()
        return Response({'status': 'rejected'})


class SubTaskViewSet(viewsets.ModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        subtask = self.get_object()
        subtask.progress = request.data.get('progress', 0)
        if subtask.progress == 100:
            subtask.status = 'COMPLETED'
        subtask.save()
        return Response({'status': 'progress updated'})


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
