import uuid
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.contrib.postgres.indexes import GinIndex
from simple_history.models import HistoricalRecords

from .core import Court, Judge
from .clients import Client

CASE_STATUS_CHOICES = [
    ('Attendance', 'Attendance'),
    ('Motion', 'Motion'),
    ('Framing of Charge', 'Framing of Charge'),
    ('Submission of W/R/S', 'Submission of W/R/S'),
    ('Arguments on application', 'Arguments on application'),
    ('Scheduling Conference', 'Scheduling Conference'),
    ('ISSUES', 'ISSUES'),
    ('Plaintiff evidence', 'Plaintiff evidence'),
    ('Defendant evidence', 'Defendant evidence'),
    ('Statement of accused', 'Statement of accused'),
    ('Final arguments', 'Final arguments'),
    ('Order', 'Order'),
    ('Conciliation', 'Conciliation'),
    ('Re-conciliation', 'Re-conciliation'),
]

CASE_CATEGORY_CHOICES = [
    ('Civil Trial', 'Civil Trial'),
    ('Criminal Trial', 'Criminal Trial'),
    ('Family Trial', 'Family Trial'),
    ('Complaint Cases', 'Complaint Cases'),
    ('Civil Appeal', 'Civil Appeal'),
    ('Criminal Appeal', 'Criminal Appeal'),
    ('Family Appeal', 'Family Appeal'),
    ('Revenue Cases', 'Revenue Cases'),
    ('Civil Revision', 'Civil Revision'),
    ('Criminal Revision', 'Criminal Revision'),
    ('Rent Controller', 'Rent Controller'),
    ('Writ Petition', 'Writ Petition'),
    ('Quashment', 'Quashment'),
    ('Service matter', 'Service matter'),
    ('Consumer Court', 'Consumer Court'),
    ('Labour Court', 'Labour Court'),
    ('Drug Court', 'Drug Court'),
    ('Banking Court', 'Banking Court'),
    ('Taxation / Corporate', 'Taxation / Corporate'),
]

CASE_PRIORITY_CHOICES = [
    ('Low', 'Low'),
    ('Medium', 'Medium'),
    ('High', 'High'),
    ('Urgent', 'Urgent'),
]

CLOSURE_REASON_CHOICES = [
    ('Won', 'Won'),
    ('Lost', 'Lost'),
    ('Settled', 'Settled'),
    ('Withdrawn', 'Withdrawn'),
    ('Dismissed', 'Dismissed'),
]

class Case(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')
    assigned_to = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_cases'
    )
    case_number = models.CharField(max_length=100, db_index=True)
    court = models.ForeignKey(Court, on_delete=models.RESTRICT, related_name='cases')
    judge = models.ForeignKey(Judge, on_delete=models.RESTRICT, related_name='cases')
    opponent_name = models.CharField(max_length=255, db_index=True)
    total_fee = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(max_length=50, choices=CASE_STATUS_CHOICES, default='Attendance', db_index=True)
    category = models.CharField(max_length=100, choices=CASE_CATEGORY_CHOICES, default='Civil Trial', db_index=True)
    priority = models.CharField(max_length=50, choices=CASE_PRIORITY_CHOICES, default='Medium')
    is_active = models.BooleanField(default=True, db_index=True)
    closure_reason = models.CharField(max_length=50, choices=CLOSURE_REASON_CHOICES, blank=True, default='')
    filing_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_fee = None
        old_status = None
        old_priority = None
        old_category = None
        old_is_active = None
        
        if not is_new:
            try:
                old_case = Case.objects.get(pk=self.pk)
                old_fee = old_case.total_fee
                old_status = old_case.status
                old_priority = old_case.priority
                old_category = old_case.category
                old_is_active = old_case.is_active
            except Case.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if not is_new and old_fee is not None and old_fee != self.total_fee:
            from .finance import Invoice
            Invoice.recalculate_status_for_case(self)

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

        # Track case closure / reopening
        if not is_new and old_is_active is not None and old_is_active != self.is_active:
            if not self.is_active:
                CaseTimeline.objects.create(
                    case=self,
                    activity_type='StatusChange',
                    description=f"Case closed — Reason: {self.closure_reason or 'Not specified'}"
                )
            else:
                CaseTimeline.objects.create(
                    case=self,
                    activity_type='StatusChange',
                    description="Case reopened"
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
    hearing_date = models.DateField(db_index=True)
    hearing_time = models.TimeField(null=True, blank=True)
    next_date = models.DateField(null=True, blank=True)
    hearing_stage = models.CharField(max_length=150, default='Attendance', db_index=True)
    is_completed = models.BooleanField(default=False, db_index=True)
    notes = models.TextField(blank=True, null=True)
    history = HistoricalRecords()

    def clean(self):
        if self.next_date and self.hearing_date and self.next_date <= self.hearing_date:
            raise ValidationError({
                'next_date': f"Next date ({self.next_date}) must be after the hearing date ({self.hearing_date})."
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
