import uuid
from django.db import models
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, default='Staff')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Court(models.Model):
    COURT_TYPES = [
        ('Supreme Court', 'Supreme Court'),
        ('High Court', 'High Court'),
        ('District Court', 'District Court'),
        ('Civil Court', 'Civil Court'),
        ('Family Court', 'Family Court'),
        ('Sessions Court', 'Sessions Court'),
        ('Consumer Court', 'Consumer Court'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, choices=COURT_TYPES)
    district = models.CharField(max_length=150, blank=True, null=True)
    tehsil = models.CharField(max_length=150, blank=True, null=True)
    court_room = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} ({self.type})"

class Judge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    court = models.ForeignKey(Court, on_delete=models.RESTRICT, related_name='judges')
    designation = models.CharField(max_length=150, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} - {self.designation or 'Judge'} ({self.court.name})"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'Broadcast'}"
