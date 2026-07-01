from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import User, Department, Task, SubTask, Submission, TaskReport, Notification, UserModulePermission

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs) # type: ignore
        user = self.user # type: ignore
        
        if not user.is_active: # type: ignore
            raise AuthenticationFailed('Your account is inactive. Please contact the administrator.', code='account_inactive')
            
        data['user'] = { # type: ignore
            'id': user.id, # type: ignore
            'username': user.username, # type: ignore
            'email': user.email, # type: ignore
            'role': user.role, # type: ignore
            'department': user.department_id, # type: ignore
            'full_name': user.get_full_name(), # type: ignore
            'must_change_password': user.must_change_password # type: ignore
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'department', 'department_name', 'first_name', 'last_name', 'is_active', 'must_change_password')

class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'department', 'department_name', 'first_name', 'last_name', 'is_active', 'password', 'must_change_password')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class SubTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.get_full_name')
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    class Meta:
        model = SubTask
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    assigned_to_hod_name = serializers.ReadOnlyField(source='assigned_to_hod.get_full_name')
    department_name = serializers.ReadOnlyField(source='department.name')
    
    class Meta:
        model = Task
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.ReadOnlyField(source='submitted_by.get_full_name')
    class Meta:
        model = Submission
        fields = '__all__'

class TaskReportSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()
    task_name = serializers.ReadOnlyField(source='task.title')
    dean_name = serializers.SerializerMethodField()
    hod_name = serializers.SerializerMethodField()
    faculty_name = serializers.SerializerMethodField()
    subtask_title = serializers.ReadOnlyField(source='subtask.title')

    class Meta:
        model = TaskReport
        fields = '__all__'

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_assigned_by_name(self, obj):
        if not obj.assigned_by:
            return ''
        return obj.assigned_by.get_full_name() or obj.assigned_by.username

    def get_rejected_by_name(self, obj):
        if not obj.rejected_by:
            return ''
        return obj.rejected_by.get_full_name() or obj.rejected_by.username

    def get_dean_name(self, obj):
        return obj.task.created_by.get_full_name() or obj.task.created_by.username

    def get_hod_name(self, obj):
        if not obj.task.assigned_to_hod:
            return ''
        return obj.task.assigned_to_hod.get_full_name() or obj.task.assigned_to_hod.username

    def get_faculty_name(self, obj):
        if obj.role == 'FACULTY':
            return obj.user.get_full_name() or obj.user.username
        return ''

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class UserModulePermissionSerializer(serializers.ModelSerializer):
    module_label = serializers.CharField(source='get_module_display', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = UserModulePermission
        fields = (
            'id', 'user', 'user_name', 'module', 'module_label',
            'can_view', 'can_edit', 'can_delete', 'can_access', 'updated_at'
        )
        read_only_fields = ('updated_at',)

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
