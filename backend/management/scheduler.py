import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.core.management import call_command

logger = logging.getLogger(__name__)

def run_deadline_processor():
    try:
        call_command('process_deadlines')
    except Exception as e:
        logger.error(f"Failed to process deadlines: {e}")

def start():
    scheduler = BackgroundScheduler()
    # Schedule the job to run every day at midnight (00:00)
    scheduler.add_job(
        run_deadline_processor,
        trigger=CronTrigger(hour=0, minute=0),
        id='process_deadlines_job',
        name='Daily Deadline Processor',
        replace_existing=True,
    )
    # Also run once at startup for testing (optional, we can comment this out)
    # scheduler.add_job(run_deadline_processor, 'date', run_date=timezone.now() + timezone.timedelta(seconds=10))

    scheduler.start()
    logger.info("Scheduler started. Daily deadline processor configured.")
