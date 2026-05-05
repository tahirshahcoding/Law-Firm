from django.db import models
from django.contrib.auth.models import User
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, default='Staff')
    # Default granular permissions
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile', null=True, blank=True)
    client_number = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    # db_index=True makes the Conflict-of-Interest search O(1) time complexity
    cnic = models.CharField(max_length=15, unique=True, db_index=True) 
    mobile_number = models.CharField(max_length=20)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.client_number:
            # Use MAX to find the highest number ever issued.
            # COUNT would fail if any clients were ever deleted (count=4 could
            # collide with an existing C-005), causing a 500 IntegrityError.
            from django.db.models import Max
            import re
            last = Client.objects.aggregate(max_num=Max('client_number'))['max_num']
            if last:
                match = re.search(r'\d+$', last)
                next_num = (int(match.group()) + 1) if match else 1
            else:
                next_num = 1
            self.client_number = f"C-{next_num:03d}"
        super(Client, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_number} - {self.name}"

class Case(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')
    case_number = models.CharField(max_length=100)
    court = models.CharField(max_length=150)
    judge = models.CharField(max_length=150)
    opponent_name = models.CharField(max_length=255, db_index=True)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.case_number} - {self.client.name} vs {self.opponent_name}"

class Hearing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearings')
    hearing_date = models.DateField()
    next_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Hearing on {self.hearing_date} for {self.case.case_number}"

class HearingDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hearing = models.ForeignKey(Hearing, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='hearing_documents/')
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='payments')
    amount_received = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount_received} received for {self.case.case_number}"

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='invoices')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=50, default='Pending') # Pending, Partial, Paid
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from django.db.models import Max
            import re
            last = Invoice.objects.aggregate(max_num=Max('invoice_number'))['max_num']
            if last:
                match = re.search(r'\d+$', last)
                next_num = (int(match.group()) + 1) if match else 1
            else:
                next_num = 1
            self.invoice_number = f"INV-{next_num:03d}"
        super(Invoice, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} for {self.case.case_number}"

class ConsultationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    inquiry_type = models.CharField(max_length=100)
    message = models.TextField()
    status = models.CharField(max_length=50, default='New') # New, Contacted, Converted, Closed
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.inquiry_type} ({self.status})"