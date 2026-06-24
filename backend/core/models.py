from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('DEAN', 'Dean'),
        ('HOD', 'HOD'),
        ('FACULTY', 'Faculty'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    objects = models.Manager()

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED_HOD', 'Submitted to HOD'),
        ('HOD_APPROVED', 'HOD Approved'),
        ('SUBMITTED_DEAN', 'Submitted to Dean'),
        ('DEAN_APPROVED', 'Dean Approved'),
        ('REJECTED_HOD', 'Rejected by HOD'),
        ('REJECTED_DEAN', 'Rejected by Dean'),
        ('COMPLETED', 'Completed'),
    )
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to_hod = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hod_tasks')
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ASSIGNED')
    attachment = models.FileField(upload_to='tasks/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = models.Manager()

    def __str__(self):
        return self.title

class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='faculty_tasks')
    status = models.CharField(max_length=20, default='ASSIGNED')
    progress = models.IntegerField(default=0)
    deadline = models.DateTimeField()
    objects = models.Manager()

    def __str__(self):
        return f"{self.task.title} - {self.title}"

class Submission(models.Model):
    subtask = models.ForeignKey(SubTask, on_delete=models.CASCADE, related_name='submissions', null=True, blank=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions', null=True, blank=True)
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    attachment = models.FileField(upload_to='submissions/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    feedback = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    objects = models.Manager()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    objects = models.Manager()
