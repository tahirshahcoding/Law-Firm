from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Reads the JWT access token from an httpOnly cookie instead of the
    Authorization header.  This eliminates XSS exposure because JavaScript
    cannot read httpOnly cookies.

    Cookie name is controlled by settings.SIMPLE_JWT['AUTH_COOKIE']
    (default: 'access_token').
    """

    # Safe HTTP methods do not mutate state — CSRF protection is not needed.
    SAFE_METHODS = {'GET', 'HEAD', 'OPTIONS'}

    def authenticate(self, request):
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # No cookie present — not authenticated (let DRF return 401)
            return None

        validated_token = self.get_validated_token(raw_token)

        # Only enforce CSRF on state-changing requests (POST, PUT, PATCH, DELETE).
        # GET/HEAD/OPTIONS are safe and do not require a CSRF token.
        if request.method not in self.SAFE_METHODS:
            self.enforce_csrf(request)

        return self.get_user(validated_token), validated_token

    def enforce_csrf(self, request):
        """
        Enforce CSRF validation for Cookie-based JWT auth on mutating requests.
        """
        check = CSRFCheck(request)
        # populates request.META['CSRF_COOKIE'], which is used in process_view()
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)
