from decimal import Decimal
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.contrib.auth.models import User
from django.contrib.postgres.indexes import GinIndex
from simple_history.models import HistoricalRecords
import uuid


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, default='Staff')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='client_profile', null=True, blank=True
    )
    client_number = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    # db_index=True makes the Conflict-of-Interest search O(1) time complexity
    cnic = models.CharField(max_length=15, unique=True, db_index=True)
    mobile_number = models.CharField(max_length=20)
    address = models.TextField()
    portal_password = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.client_number:
            # Lock the table-level MAX so two concurrent inserts cannot read the
            # same maximum and generate a duplicate client_number (TOCTOU fix).
            from django.db.models import Max
            import re
            # select_for_update on a filtered queryset acts as an advisory lock here.
            # We lock the row with the highest client_number to serialize writers.
            locked = Client.objects.select_for_update().order_by('-client_number').first()
            last = locked.client_number if locked else None
            if last:
                match = re.search(r'\d+$', last)
                next_num = (int(match.group()) + 1) if match else 1
            else:
                next_num = 1
            self.client_number = f"C-{next_num:03d}"  # type: ignore[assignment]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_number} - {self.name}"

    class Meta:
        indexes = [
            GinIndex(fields=['name'], opclasses=['gin_trgm_ops'], name='client_name_gin_idx'),
            GinIndex(fields=['cnic'], opclasses=['gin_trgm_ops'], name='client_cnic_gin_idx'),
            GinIndex(fields=['mobile_number'], opclasses=['gin_trgm_ops'], name='client_mob_gin_idx'),
        ]


CASE_STATUS_CHOICES = [
    ('Consultation', 'Consultation'),
    ('Case Accepted', 'Case Accepted'),
    ('Documentation Pending', 'Documentation Pending'),
    ('Filing in Progress', 'Filing in Progress'),
    ('Filed', 'Filed'),
    ('Under Trial', 'Under Trial'),
    ('Evidence Stage', 'Evidence Stage'),
    ('Arguments Stage', 'Arguments Stage'),
    ('Judgment Reserved', 'Judgment Reserved'),
    ('Decided', 'Decided'),
    ('Appeal', 'Appeal'),
    ('Closed - Won', 'Closed - Won'),
    ('Closed - Lost', 'Closed - Lost'),
    ('Closed - Settled', 'Closed - Settled'),
    ('Closed - Withdrawn', 'Closed - Withdrawn'),
    ('Closed - Dismissed', 'Closed - Dismissed'),
    ('Archived', 'Archived'),
    ('Active', 'Active'), # Legacy support
    ('Closed', 'Closed'), # Legacy support
]

CASE_CATEGORY_CHOICES = [
    ('Civil', 'Civil'),
    ('Criminal', 'Criminal'),
    ('Family', 'Family'),
    ('Property', 'Property'),
    ('Tax', 'Tax'),
    ('Corporate', 'Corporate'),
    ('Banking', 'Banking'),
    ('Constitutional', 'Constitutional'),
    ('Service Matters', 'Service Matters'),
    ('Consumer Court', 'Consumer Court'),
    ('Cyber Crime', 'Cyber Crime'),
    ('Intellectual Property', 'Intellectual Property'),
    ('Labour Court', 'Labour Court'),
    ('Arbitration', 'Arbitration'),
]

CASE_PRIORITY_CHOICES = [
    ('Low', 'Low'),
    ('Medium', 'Medium'),
    ('High', 'High'),
    ('Urgent', 'Urgent'),
]

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

class Case(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')
    assigned_to = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_cases'
    )
    case_number = models.CharField(max_length=100)
    court = models.ForeignKey(Court, on_delete=models.RESTRICT, related_name='cases')
    judge = models.ForeignKey(Judge, on_delete=models.RESTRICT, related_name='cases')
    opponent_name = models.CharField(max_length=255, db_index=True)
    total_fee = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(max_length=50, choices=CASE_STATUS_CHOICES, default='Case Accepted')
    category = models.CharField(max_length=100, choices=CASE_CATEGORY_CHOICES, default='Civil')
    priority = models.CharField(max_length=50, choices=CASE_PRIORITY_CHOICES, default='Medium')
    filing_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        When total_fee changes, recalculate every linked invoice's status so
        they reflect the new fee amount (e.g. a fee reduction may flip Partial -> Paid).
        """
        is_new = self.pk is None
        old_fee = None
        old_status = None
        old_priority = None
        old_category = None
        
        if not is_new:
            try:
                old_case = Case.objects.get(pk=self.pk)
                old_fee = old_case.total_fee
                old_status = old_case.status
                old_priority = old_case.priority
                old_category = old_case.category
            except Case.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if not is_new and old_fee is not None and old_fee != self.total_fee:
            Invoice.recalculate_status_for_case(self)

        # Generate timeline entries
        if is_new:
            CaseTimeline.objects.create(
                case=self,
                activity_type='StatusChange',
                description=f"Case opened with status: {self.status}"
            )
        elif old_status and old_status != self.status:
            CaseTimeline.objects.create(
                case=self,
                activity_type='StatusChange',
                description=f"Case status changed from {old_status} to {self.status}"
            )
            
        if not is_new and old_priority and old_priority != self.priority:
            CaseTimeline.objects.create(
                case=self,
                activity_type='StatusChange',
                description=f"Case priority changed from {old_priority} to {self.priority}"
            )
            
        if not is_new and old_category and old_category != self.category:
            CaseTimeline.objects.create(
                case=self,
                activity_type='StatusChange',
                description=f"Case category changed from {old_category} to {self.category}"
            )

    def __str__(self):
        return f"{self.case_number} - {self.client.name} vs {self.opponent_name} ({self.category})"

    class Meta:
        indexes = [
            GinIndex(fields=['opponent_name'], opclasses=['gin_trgm_ops'], name='case_opp_name_gin_idx'),
            GinIndex(fields=['case_number'], opclasses=['gin_trgm_ops'], name='case_no_gin_idx'),
        ]


class CaseTimeline(models.Model):
    ACTIVITY_TYPES = [
        ('Hearing', 'Hearing'),
        ('Document', 'Document'),
        ('Payment', 'Payment'),
        ('Note', 'Note'),
        ('StatusChange', 'StatusChange'),
        ('General', 'General'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='timeline')
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.activity_type} for {self.case.case_number} at {self.timestamp}"


class Hearing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearings')
    hearing_date = models.DateField()
    hearing_time = models.TimeField(null=True, blank=True)
    next_date = models.DateField(null=True, blank=True)
    hearing_stage = models.CharField(max_length=150, default='Attendance', db_index=True)
    notes = models.TextField(blank=True, null=True)
    history = HistoricalRecords()

    def clean(self):
        """next_date must be strictly after hearing_date."""
        if self.next_date and self.hearing_date and self.next_date <= self.hearing_date:
            raise ValidationError({
                'next_date': (
                    f"Next date ({self.next_date}) must be after "
                    f"the hearing date ({self.hearing_date})."
                )
            })

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        self.full_clean()
        super().save(*args, **kwargs)
        if is_new:
            CaseTimeline.objects.create(
                case=self.case,
                activity_type='Hearing',
                description=f"Hearing scheduled on {self.hearing_date} for stage: {self.hearing_stage}"
            )

    def __str__(self):
        return f"Hearing on {self.hearing_date} for {self.case.case_number}"


class HearingDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hearing = models.ForeignKey(Hearing, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='hearing_documents/')
    name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            CaseTimeline.objects.create(
                case=self.hearing.case,
                activity_type='Document',
                description=f"Document uploaded: {self.name} for hearing on {self.hearing.hearing_date}"
            )

    def __str__(self):
        return self.name


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.title


class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('Court Fee', 'Court Fee'),
        ('Stamp Paper', 'Stamp Paper'),
        ('Printing', 'Printing'),
        ('Fuel', 'Fuel'),
        ('Courier', 'Courier'),
        ('Staff Salary', 'Staff Salary'),
        ('Office Rent', 'Office Rent'),
        ('Internet', 'Internet'),
        ('Electricity', 'Electricity'),
        ('Other', 'Other'),
    ]
    PAYMENT_METHODS = [
        ('Cash', 'Cash'),
        ('Bank Transfer', 'Bank Transfer'),
        ('Cheque', 'Cheque'),
        ('Online', 'Online'),
        ('Other', 'Other')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    date = models.DateField()
    description = models.TextField(blank=True)
    vendor = models.CharField(max_length=255, blank=True, null=True)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='Cash')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.category} - Rs {self.amount}"


class Invoice(models.Model):
    # ── Status constants ───────────────────────────────────────────────────────
    STATUS_UNPAID = 'Unpaid'
    STATUS_PARTIAL = 'Partial'
    STATUS_PAID    = 'Paid'
    STATUS_CHOICES = [
        (STATUS_UNPAID, 'Unpaid'),
        (STATUS_PARTIAL, 'Partial'),
        (STATUS_PAID,    'Paid'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='invoices')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=50, default=STATUS_UNPAID, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def clean(self):
        """due_date must be on or after issue_date."""
        if self.due_date and self.issue_date and self.due_date < self.issue_date:
            raise ValidationError({'due_date': "Due date cannot be before the issue date."})

    @property
    def total_amount(self):
        if hasattr(self, '_prefetched_objects_cache') and 'items' in self._prefetched_objects_cache:
            return sum(item.amount for item in self.items.all()) or Decimal('0.00')
        from django.db.models import Sum
        return self.items.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    @property
    def paid_amount(self):
        if hasattr(self, '_prefetched_objects_cache') and 'payments' in self._prefetched_objects_cache:
            return sum(payment.amount_received for payment in self.payments.all()) or Decimal('0.00')
        from django.db.models import Sum
        return self.payments.aggregate(total=Sum('amount_received'))['total'] or Decimal('0.00')

    @property
    def balance(self):
        return self.total_amount - self.paid_amount

    @property
    def dynamic_status(self):
        from django.utils import timezone
        total = self.total_amount
        paid = self.paid_amount
        balance = total - paid
        if paid == 0:
            status = 'Unpaid'
        elif paid > 0 and paid < total:
            status = 'Partial'
        else:
            status = 'Paid'
            
        if status != 'Paid' and self.due_date and self.due_date < timezone.now().date() and balance > 0:
            return 'Overdue'
        return status

    @property
    def last_payment_date(self):
        if hasattr(self, '_prefetched_objects_cache') and 'payments' in self._prefetched_objects_cache:
            payments = list(self.payments.all())
            if not payments:
                return None
            return max(payments, key=lambda p: p.payment_date).payment_date
        last_payment = self.payments.order_by('-payment_date').first()
        return last_payment.payment_date if last_payment else None

    @property
    def days_overdue(self):
        from django.utils import timezone
        if self.dynamic_status != 'Paid' and self.due_date and self.due_date < timezone.now().date():
            return (timezone.now().date() - self.due_date).days
        return 0

    @classmethod
    def recalculate_status_for_case(cls, case):
        """
        Recalculates status for all invoices of a given case.
        """
        for invoice in case.invoices.all():
            invoice.save()

    def save(self, *args, **kwargs):
        with transaction.atomic():  # type: ignore[attr-defined]
            self.full_clean()
            if not self.invoice_number:
                import re
                locked = Invoice.objects.select_for_update().order_by('-invoice_number').first()
                last = locked.invoice_number if locked else None
                if last:
                    match = re.search(r'\d+$', last)
                    next_num = (int(match.group()) + 1) if match else 1
                else:
                    next_num = 1
                self.invoice_number = f"INV-{next_num:03d}" # type: ignore
                
            # Update physical status column based on amounts
            if self.pk is not None:
                total = self.total_amount
                paid = self.paid_amount
                if total == 0 or paid == 0:
                    self.status = self.STATUS_UNPAID # type: ignore
                elif paid >= total:
                    self.status = self.STATUS_PAID # type: ignore
                else:
                    self.status = self.STATUS_PARTIAL # type: ignore

            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} for {self.case.case_number}"


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])

    def __str__(self):
        return f"{self.description} - Rs {self.amount}"


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('Cash', 'Cash'),
        ('Bank Transfer', 'Bank Transfer'),
        ('Cheque', 'Cheque'),
        ('Online', 'Online'),
        ('Other', 'Other')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount_received = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='Cash')
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"Rs {self.amount_received} for {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        with transaction.atomic():  # type: ignore[attr-defined]
            is_new = self.pk is None
            self.full_clean()
            super().save(*args, **kwargs)
            self.invoice.save() # Trigger invoice status recalculation
            if is_new:
                CaseTimeline.objects.create(
                    case=self.invoice.case,
                    activity_type='Payment',
                    description=f"Payment received: Rs {self.amount_received} via {self.payment_method}"
                )

    def delete(self, *args, **kwargs):
        with transaction.atomic():  # type: ignore[attr-defined]
            invoice = self.invoice
            super().delete(*args, **kwargs)
            try:
                invoice.refresh_from_db(fields=['id'])
                invoice.save()
            except Invoice.DoesNotExist:
                pass


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
    
    # Optional links to core entities
    case = models.ForeignKey(Case, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='calendar_events')
    
    # One-to-one links for auto-syncing (ensure deletion cascades)
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


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

from datetime import datetime, time
from django.utils import timezone

@receiver(post_save, sender=Hearing)
def sync_hearing_event(sender, instance, **kwargs):
    if not instance.hearing_date:
        CalendarEvent.objects.filter(reference_hearing=instance).delete()
        return
    start_dt = timezone.make_aware(datetime.combine(instance.hearing_date, instance.hearing_time or time(9, 0)))
    CalendarEvent.objects.update_or_create(
        reference_hearing=instance,
        defaults={
            'title': f"Hearing: {instance.case.case_number}",
            'event_type': 'Court Hearing',
            'start_date': start_dt,
            'end_date': start_dt + timezone.timedelta(hours=1),
            'all_day': instance.hearing_time is None,
            'description': instance.notes or '',
            'location': f"{instance.case.court.name} - {instance.case.court.court_room or ''}",
            'case': instance.case,
            'client': instance.case.client,
            'assigned_to': instance.case.assigned_to,
        }
    )

@receiver(post_save, sender=Task)
def sync_task_event(sender, instance, **kwargs):
    if not instance.due_date:
        CalendarEvent.objects.filter(reference_task=instance).delete()
        return
    start_dt = timezone.make_aware(datetime.combine(instance.due_date, time(0, 0)))
    CalendarEvent.objects.update_or_create(
        reference_task=instance,
        defaults={
            'title': f"Task Due: {instance.title}",
            'event_type': 'Internal Task',
            'start_date': start_dt,
            'all_day': True,
        }
    )

@receiver(post_save, sender=Invoice)
def sync_invoice_event(sender, instance, **kwargs):
    if not instance.due_date or instance.status == 'Paid':
        CalendarEvent.objects.filter(reference_invoice=instance).delete()
        return
    start_dt = timezone.make_aware(datetime.combine(instance.due_date, time(0, 0)))
    CalendarEvent.objects.update_or_create(
        reference_invoice=instance,
        defaults={
            'title': f"Payment Due: {instance.invoice_number}",
            'event_type': 'Payment Due',
            'start_date': start_dt,
            'all_day': True,
            'case': instance.case,
            'client': instance.case.client,
        }
    )

@receiver(post_save, sender=ConsultationRequest)
def sync_consultation_event(sender, instance, **kwargs):
    if not instance.scheduled_date:
        CalendarEvent.objects.filter(reference_consultation=instance).delete()
        return
    CalendarEvent.objects.update_or_create(
        reference_consultation=instance,
        defaults={
            'title': f"Meeting: {instance.name}",
            'event_type': 'Client Meeting',
            'start_date': instance.scheduled_date,
            'end_date': instance.scheduled_date + timezone.timedelta(hours=1),
            'all_day': False,
            'description': instance.message,
        }
    )

@receiver(post_save, sender=Case)
def sync_case_filing_event(sender, instance, **kwargs):
    if not instance.filing_deadline:
        CalendarEvent.objects.filter(case=instance, event_type='Filing Deadline').delete()
        return
    start_dt = timezone.make_aware(datetime.combine(instance.filing_deadline, time(0, 0)))
    CalendarEvent.objects.update_or_create(
        case=instance,
        event_type='Filing Deadline',
        defaults={
            'title': f"Filing Deadline: {instance.case_number}",
            'start_date': start_dt,
            'all_day': True,
            'client': instance.client,
            'assigned_to': instance.assigned_to,
        }
    )


# ── Notification Triggers ─────────────────────────────────────────────────────
from django.db.models.signals import pre_save

@receiver(post_save, sender=Client)
def notify_new_client(sender, instance, created, **kwargs):
    if created:
        admin_users = User.objects.filter(is_superuser=True)
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                title="New Client Added",
                message=f"Client '{instance.name}' was added to the system.",
                type="info"
            )

@receiver(pre_save, sender=Case)
def track_case_status_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_case = Case.objects.get(pk=instance.pk)
            if old_case.status != instance.status:
                instance._status_changed = True
                instance._old_status = old_case.status
        except Case.DoesNotExist:
            pass

@receiver(post_save, sender=Case)
def notify_case_updates(sender, instance, created, **kwargs):
    if created:
        admin_users = User.objects.filter(is_superuser=True)
        for admin in admin_users:
            if admin != instance.assigned_to:
                Notification.objects.create(user=admin, title="New Case Created", message=f"Case {instance.case_number} was created.", type="info")
        if instance.assigned_to:
            Notification.objects.create(user=instance.assigned_to, title="New Case Assigned", message=f"You have been assigned Case {instance.case_number}.", type="info")
    elif getattr(instance, '_status_changed', False):
        if instance.assigned_to:
            Notification.objects.create(user=instance.assigned_to, title="Case Status Updated", message=f"Case {instance.case_number} changed to {instance.status}.", type="success")

@receiver(post_save, sender=Payment)
def notify_payment_received(sender, instance, created, **kwargs):
    if created:
        admin_users = User.objects.filter(is_superuser=True)
        for admin in admin_users:
            Notification.objects.create(user=admin, title="Payment Received", message=f"Rs {instance.amount_received} received for {instance.invoice.case.case_number}.", type="success")


from django.db.models.signals import post_delete

@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_status_on_item_change(sender, instance, **kwargs):
    """
    Recalculates and saves the status of the associated Invoice when
    an InvoiceItem is created, updated, or deleted.
    """
    invoice = instance.invoice
    total = invoice.total_amount
    paid = invoice.paid_amount
    if total == 0 or paid == 0:
        new_status = Invoice.STATUS_UNPAID
    elif paid >= total:
        new_status = Invoice.STATUS_PAID
    else:
        new_status = Invoice.STATUS_PARTIAL
        
    if invoice.status != new_status:
        invoice.status = new_status
        invoice.save(update_fields=['status'])

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

@receiver(post_save, sender=Hearing)
def auto_create_hearing_deadline(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_auto_deadline_created', False):
        instance._auto_deadline_created = True
        Deadline.objects.create(
            title=f"Prepare for Hearing: {instance.hearing_stage}",
            case=instance.case,
            deadline_type='Court Filing',
            assigned_to=instance.case.assigned_to,
            priority='High',
            status='Pending',
            due_date=instance.hearing_date,
            description=f"Auto-generated deadline for upcoming hearing on {instance.hearing_date}. Notes: {instance.notes or ''}",
            reminders=[7, 3, 1]
        )

@receiver(post_save, sender=Invoice)
def auto_create_invoice_deadline(sender, instance, created, **kwargs):
    if created and not getattr(instance, '_auto_deadline_created', False):
        instance._auto_deadline_created = True
        Deadline.objects.create(
            title=f"Payment Due: {instance.invoice_number}",
            case=instance.case,
            deadline_type='Payment Due',
            assigned_to=instance.case.assigned_to if instance.case else None,
            priority='High',
            status='Pending',
            due_date=instance.due_date,
            description=f"Auto-generated deadline for invoice payment. Amount: {instance.total_amount}",
            reminders=[3, 1]
        )
