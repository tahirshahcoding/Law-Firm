from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from management.models import Deadline, Notification
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Processes all pending deadlines and issues notifications based on reminders'

    def handle(self, *args, **kwargs):
        today = date.today()
        pending_deadlines = Deadline.objects.filter(status='Pending')
        
        superusers = list(User.objects.filter(is_superuser=True))
        
        count = 0
        
        for deadline in pending_deadlines:
            days_remaining = (deadline.due_date - today).days
            should_notify = False
            message = ""
            msg_type = "info"
            
            # 1. Overdue logic (Daily if overdue)
            if days_remaining < 0:
                should_notify = True
                message = f"OVERDUE: '{deadline.title}' was due {-days_remaining} days ago!"
                msg_type = "error"
                
            # 2. Due Today logic
            elif days_remaining == 0:
                should_notify = True
                message = f"DUE TODAY: '{deadline.title}' must be completed today!"
                msg_type = "warning"
                
            # 3. Reminder match logic (e.g., 7, 3, 1 days)
            elif str(days_remaining) in deadline.reminders or days_remaining in deadline.reminders:
                should_notify = True
                message = f"Reminder: '{deadline.title}' is due in {days_remaining} days."
                msg_type = "info"
                
            if should_notify:
                count += 1
                
                # Determine targets
                targets = set()
                if deadline.assigned_to:
                    targets.add(deadline.assigned_to)
                else:
                    # If unassigned, notify all superusers
                    for admin in superusers:
                        targets.add(admin)
                        
                for target in targets:
                    Notification.objects.create(
                        user=target,
                        title="Deadline Alert",
                        message=message,
                        type=msg_type
                    )

        self.stdout.write(self.style.SUCCESS(f'Successfully processed deadlines. Created {count} notifications.'))
