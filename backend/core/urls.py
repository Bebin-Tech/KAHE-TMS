from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, TaskViewSet, SubTaskViewSet, 
    SubmissionViewSet, TaskReportViewSet, DepartmentViewSet, NotificationViewSet,
    UserModulePermissionViewSet, NoteViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'subtasks', SubTaskViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'reports', TaskReportViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'user-module-permissions', UserModulePermissionViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
