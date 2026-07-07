import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

# Configure logger for recording tracebacks of unhandled errors
logger = logging.getLogger('management.exceptions')

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Interceptors unhandled exceptions to return valid JSON structures,
    preventing 500 HTML responses from breaking JSON parsers on clients.
    """
    # 1. Call DRF's default exception handler first to get the standard response
    response = exception_handler(exc, context)

    if response is not None:
        # standard DRF exceptions (ValidationErrors, NotFound, PermissionDenied, etc.)
        # Inject standard status_code field for easier client-side handling
        if isinstance(response.data, dict):
            response.data['status_code'] = response.status_code
        elif isinstance(response.data, list):
            # If the response data is a list (rare, but possible), wrap it in a dict
            response.data = {
                'errors': response.data,
                'status_code': response.status_code
            }
    else:
        # Unhandled backend exceptions (Database outage, TypeError, AttributeError, etc.)
        # Log the traceback details internally for debugging
        logger.error("Unhandled API Exception: %s", str(exc), exc_info=True)

        # Return a safe, clean JSON payload rather than Django's default HTML 500 template.
        # Only expose the raw exception string in DEBUG mode — in production it may leak
        # internal schema details (table names, column names, stack traces, etc.)
        from django.conf import settings as django_settings
        response = Response(
            {
                'error': 'Internal Server Error',
                'detail': str(exc) if django_settings.DEBUG else 'An unexpected error occurred on the server.',
                'status_code': 500
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
