import logging
from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_daily_deadlines(self):
    """
    Executes daily at midnight via Celery Beat.
    Scans pending deadlines, flags overdue items, and creates alerts/notifications.
    """
    try:
        logger.info("Starting daily deadline evaluation task via Celery Beat...")
        call_command('process_deadlines')
        logger.info("Successfully finished processing daily deadlines.")
        return "Daily deadline processing completed successfully."
    except Exception as exc:
        logger.error(f"Error processing deadlines: {exc}")
        # Retry up to 3 times with exponential backoff if database or network hiccups occur
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@shared_task
def send_async_notification(user_id, title, message, notif_type="info"):
    """
    Example background task for sending notifications asynchronously without blocking WSGI workers.
    """
    from management.models import Notification
    try:
        Notification.objects.create(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type
        )
        return f"Notification sent to user {user_id}."
    except Exception as e:
        logger.error(f"Failed to send async notification: {e}")
        return str(e)
