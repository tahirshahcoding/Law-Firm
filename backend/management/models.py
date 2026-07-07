from decimal import Decimal
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.contrib.auth.models import User
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


class Case(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')
    assigned_to = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='assigned_cases'
    )
    case_number = models.CharField(max_length=100)
    court = models.CharField(max_length=150)
    judge = models.CharField(max_length=150)
    district = models.CharField(max_length=150, blank=True, null=True, db_index=True)
    tehsil = models.CharField(max_length=150, blank=True, null=True, db_index=True)
    opponent_name = models.CharField(max_length=255, db_index=True)
    total_fee = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        When total_fee changes, recalculate every linked invoice's status so
        they reflect the new fee amount (e.g. a fee reduction may flip Partial -> Paid).
        """
        is_update = self.pk is not None
        old_fee = None
        if is_update:
            try:
                old_fee = Case.objects.values_list('total_fee', flat=True).get(pk=self.pk)
            except Case.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if is_update and old_fee is not None and old_fee != self.total_fee:
            Invoice.recalculate_status_for_case(self)

    def __str__(self):
        return f"{self.case_number} - {self.client.name} vs {self.opponent_name}"


class Hearing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearings')
    hearing_date = models.DateField()
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
        self.full_clean()
        super().save(*args, **kwargs)

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
    amount_received = models.DecimalField(
        max_digits=10, decimal_places=2,
        # DB-level guard: negative or zero payments are rejected before any
        # Python logic runs, even via Django admin or raw ORM calls.
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount_received} received for {self.case.case_number}"

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        Save the payment and immediately recalculate the status of every
        invoice linked to this case, all inside a single atomic transaction.
        If the invoice update fails, the payment is also rolled back.
        """
        self.full_clean()
        super().save(*args, **kwargs)
        Invoice.recalculate_status_for_case(self.case)

    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Delete the payment and recalculate invoice statuses in the same
        atomic transaction so the two operations are never out of sync.
        Guard against cascade-deletion (where the case itself is being deleted).
        """
        case = self.case  # capture before deletion
        super().delete(*args, **kwargs)
        # If the case is also being deleted (CASCADE), skip recalculation —
        # the invoices are gone too and there is nothing to update.
        try:
            case.refresh_from_db(fields=['id'])
            Invoice.recalculate_status_for_case(case)
        except Case.DoesNotExist:
            pass


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Invoice(models.Model):
    # ── Status constants ───────────────────────────────────────────────────────
    STATUS_PENDING = 'Pending'
    STATUS_PARTIAL = 'Partial'
    STATUS_PAID    = 'Paid'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PARTIAL, 'Partial'),
        (STATUS_PAID,    'Paid'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='invoices')
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    description = models.TextField(blank=True, default='Professional Legal Services')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(
        max_length=50,
        default=STATUS_PENDING,
        choices=STATUS_CHOICES,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    def clean(self):
        """due_date must be on or after issue_date."""
        if self.due_date and self.issue_date and self.due_date < self.issue_date:
            raise ValidationError({
                'due_date': (
                    f"Due date ({self.due_date}) cannot be before "
                    f"the issue date ({self.issue_date})."
                )
            })

    @transaction.atomic
    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.invoice_number:
            # Lock the row with the highest invoice_number to serialize writers
            # and prevent duplicate INV-XXX values under concurrent inserts (TOCTOU fix).
            import re
            locked = Invoice.objects.select_for_update().order_by('-invoice_number').first()
            last = locked.invoice_number if locked else None
            if last:
                match = re.search(r'\d+$', last)
                next_num = (int(match.group()) + 1) if match else 1
            else:
                next_num = 1
            self.invoice_number = f"INV-{next_num:03d}"  # type: ignore[assignment]
        super().save(*args, **kwargs)

    # ── Core Business Logic ────────────────────────────────────────────────────

    @classmethod
    def recalculate_status_for_case(cls, case):
        """
        Recompute and persist the status for every invoice belonging to *case*.

        Business rules (applied per-invoice, chronological FIFO order):
          - allocated == 0                  -> Pending
          - 0 < allocated < invoice.amount  -> Partial
          - allocated >= invoice.amount     -> Paid

        Uses transaction.atomic + select_for_update() to prevent race conditions
        when two payments arrive simultaneously for the same case.
        Calling this inside an existing atomic block is safe — it joins the parent
        transaction rather than creating a nested savepoint.
        """
        from django.db.models import Sum

        with transaction.atomic():  # type: ignore[attr-defined]
            # Lock the invoices for this case for the duration of the transaction,
            # ordered chronologically so older invoices are paid first.
            invoices = cls.objects.select_for_update().filter(case=case).order_by('issue_date', 'created_at', 'id')

            total_paid = (
                Payment.objects
                .filter(case=case)
                .aggregate(total=Sum('amount_received'))['total']
                or 0
            )

            for invoice in invoices:
                allocated = min(invoice.amount, total_paid)
                total_paid -= allocated

                if allocated <= 0:
                    new_status = cls.STATUS_PENDING
                elif allocated >= invoice.amount:
                    new_status = cls.STATUS_PAID
                else:
                    new_status = cls.STATUS_PARTIAL

                if invoice.status != new_status:
                    invoice.status = new_status
                    # update_fields avoids re-running full_clean and history tracking
                    # on an auto-computed field change.
                    invoice.save(update_fields=['status'])

    def __str__(self):
        return f"{self.invoice_number} for {self.case.case_number}"


class ConsultationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    inquiry_type = models.CharField(max_length=100)
    message = models.TextField()
    status = models.CharField(max_length=50, default='New')  # New, Contacted, Converted, Closed
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.inquiry_type} ({self.status})"