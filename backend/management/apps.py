from django.apps import AppConfig


class ManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'management'

    def ready(self):
        import os
        # Prevent scheduler from running multiple times in dev/autoreload or celery
        if os.environ.get('RUN_MAIN', None) != 'true':
            # In production (gunicorn) RUN_MAIN isn't set this way usually, but 
            # we need to be careful with multiple gunicorn workers.
            # For HuggingFace spaces, usually it's 1 worker or we accept it running per worker.
            try:
                from . import scheduler
                scheduler.start()
            except ImportError:
                pass
