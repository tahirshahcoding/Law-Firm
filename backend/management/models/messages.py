import uuid
from django.db import models
from django.contrib.auth.models import User
from .clients import Client

class Message(models.Model):
    SENDER_CHOICES = [
        ('Client', 'Client'),
        ('Staff', 'Staff'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_CHOICES)
    staff_sender = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['client', 'created_at']),
        ]

    def __str__(self):
        sender_name = self.client.name if self.sender_type == 'Client' else (self.staff_sender.username if self.staff_sender else 'Staff')
        return f"Message from {sender_name} at {self.created_at}"
