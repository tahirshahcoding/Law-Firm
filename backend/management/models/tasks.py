import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from simple_history.models import HistoricalRecords

from .core import Notification
from .clients import Client, ConsultationRequest
from .cases import Case, Hearing
from .finance import Invoice

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.title

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('Court Hearing', 'Court Hearing'),
        ('Client Meeting', 'Client Meeting'),
        ('Filing Deadline', 'Filing Deadline'),
        ('Payment Due', 'Payment Due'),
        ('Internal Task', 'Internal Task'),
        ('Staff Leave', 'Staff Leave'),
        ('Public Holiday', 'Public Holiday'),
        ('Office Event', 'Office Event'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, default='Office Event')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    case = models.ForeignKey(Case, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    
    reference_hearing = models.OneToOneField(Hearing, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_event')
    reference_task = models.OneToOneField(Task, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_event')
    reference_invoice = models.OneToOneField(Invoice, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_event')
    reference_consultation = models.OneToOneField(ConsultationRequest, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_event')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def clean(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")

    def __str__(self):
        return f"{self.title} ({self.event_type})"

class Deadline(models.Model):
    DEADLINE_TYPES = [
        ('Court Filing', 'Court Filing'),
        ('Appeal Deadline', 'Appeal Deadline'),
        ('Evidence Submission', 'Evidence Submission'),
        ('Client Document', 'Client Document'),
        ('Payment Due', 'Payment Due'),
        ('Internal Task', 'Internal Task'),
        ('Compliance', 'Compliance'),
        ('Contract Renewal', 'Contract Renewal'),
        ('Consultation Follow-up', 'Consultation Follow-up'),
        ('Other', 'Other')
    ]
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High')
    ]
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, null=True, blank=True, related_name='deadlines')
    deadline_type = models.CharField(max_length=50, choices=DEADLINE_TYPES, default='Other')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deadlines')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    due_date = models.DateField()
    description = models.TextField(null=True, blank=True)
    reminders = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.title} - {self.due_date}"

    class Meta:
        ordering = ['due_date', '-priority']
