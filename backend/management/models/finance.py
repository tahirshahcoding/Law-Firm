import uuid
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords

from .cases import Case, CaseTimeline

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
        for invoice in case.invoices.all():
            invoice.save()

    def save(self, *args, **kwargs):
        with transaction.atomic():
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
                self.invoice_number = f"INV-{next_num:03d}"
                
            if self.pk is not None:
                total = self.total_amount
                paid = self.paid_amount
                if total == 0 or paid == 0:
                    self.status = self.STATUS_UNPAID
                elif paid >= total:
                    self.status = self.STATUS_PAID
                else:
                    self.status = self.STATUS_PARTIAL

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
        with transaction.atomic():
            is_new = self.pk is None
            self.full_clean()
            super().save(*args, **kwargs)
            self.invoice.save()
            if is_new:
                CaseTimeline.objects.create(
                    case=self.invoice.case,
                    activity_type='Payment',
                    description=f"Payment received: Rs {self.amount_received} via {self.payment_method}"
                )

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            invoice = self.invoice
            super().delete(*args, **kwargs)
            try:
                invoice.refresh_from_db(fields=['id'])
                invoice.save()
            except Invoice.DoesNotExist:
                pass
