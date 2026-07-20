from .core import UserProfile, Court, Judge, Notification
from .clients import Client, ConsultationRequest
from .cases import Case, CaseTimeline, Hearing, HearingDocument
from .finance import Expense, Invoice, InvoiceItem, Payment
from .tasks import Task, CalendarEvent, Deadline
from .messages import Message

# Ensure signals are connected when models are imported
import management.models.signals

__all__ = [
    'UserProfile', 'Court', 'Judge', 'Notification',
    'Client', 'ConsultationRequest',
    'Case', 'CaseTimeline', 'Hearing', 'HearingDocument',
    'Expense', 'Invoice', 'InvoiceItem', 'Payment',
    'Task', 'CalendarEvent', 'Deadline',
    'Message',
]
