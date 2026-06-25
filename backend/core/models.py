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
    block_name = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    objects = models.Manager()

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = (
        ('ONGOING', 'Ongoing'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED_HOD', 'Submitted to HOD'),
        ('HOD_APPROVED', 'HOD Approved'),
        ('SUBMITTED_DEAN', 'Submitted to Dean'),
        ('DEAN_APPROVED', 'Dean Approved'),
        ('REJECTED_HOD', 'Rejected by HOD'),
        ('REJECTED_DEAN', 'Rejected by Dean'),
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
    assigned_to_hod = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hod_tasks', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ONGOING')
    is_special = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
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
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_subtasks', null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='faculty_tasks')
    status = models.CharField(max_length=20, default='ASSIGNED', choices=(
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted to HOD'),
        ('APPROVED_HOD', 'Approved by HOD'),
        ('REJECTED_HOD', 'Rejected by HOD'),
        ('COMPLETED', 'Completed'),
    ))
    progress = models.IntegerField(default=0)
    deadline = models.DateTimeField()
    is_active = models.BooleanField(default=True)
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
