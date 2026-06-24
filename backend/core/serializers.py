from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import User, Department, Task, SubTask, Submission, Notification

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
    class Meta:
        model = SubTask
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    assigned_to_hod_name = serializers.ReadOnlyField(source='assigned_to_hod.get_full_name')
    
    class Meta:
        model = Task
        fields = '__all__'

class SubmissionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.ReadOnlyField(source='submitted_by.get_full_name')
    class Meta:
        model = Submission
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
