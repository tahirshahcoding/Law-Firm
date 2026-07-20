from datetime import datetime, time
from django.utils import timezone
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User

from .core import UserProfile, Notification
from .clients import Client, ConsultationRequest
from .cases import Case, Hearing
from .tasks import Task, CalendarEvent, Deadline
from .finance import Invoice, InvoiceItem, Payment

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

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

@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_status_on_item_change(sender, instance, **kwargs):
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
