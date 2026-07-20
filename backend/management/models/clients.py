import uuid
from django.db import models, transaction
from django.contrib.auth.models import User
from django.contrib.postgres.indexes import GinIndex
from simple_history.models import HistoricalRecords

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='client_profile', null=True, blank=True
    )
    client_number = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    cnic = models.CharField(max_length=15, unique=True, db_index=True)
    mobile_number = models.CharField(max_length=20)
    address = models.TextField()
    portal_password = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.client_number:
            import re
            locked = Client.objects.select_for_update().order_by('-client_number').first()
            last = locked.client_number if locked else None
            if last:
                match = re.search(r'\d+$', last)
                next_num = (int(match.group()) + 1) if match else 1
            else:
                next_num = 1
            self.client_number = f"C-{next_num:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_number} - {self.name}"

    class Meta:
        indexes = [
            GinIndex(fields=['name'], opclasses=['gin_trgm_ops'], name='client_name_gin_idx'),
            GinIndex(fields=['cnic'], opclasses=['gin_trgm_ops'], name='client_cnic_gin_idx'),
            GinIndex(fields=['mobile_number'], opclasses=['gin_trgm_ops'], name='client_mob_gin_idx'),
        ]

class ConsultationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    inquiry_type = models.CharField(max_length=100)
    message = models.TextField()
    status = models.CharField(max_length=50, default='New')  # New, Contacted, Converted, Closed
    scheduled_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name} - {self.inquiry_type} ({self.status})"
