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

        # CSRF enforcement is removed for this API.
        # Since this is a cross-origin SPA (Vercel -> Render), the frontend cannot read the
        # CSRF cookie due to the Same-Origin Policy. Instead, we rely on strict CORS
        # allowed origins. The browser's CORS preflight will block unauthorized cross-origin
        # POST/PUT/DELETE requests before they even reach the backend.

        return self.get_user(validated_token), validated_token
