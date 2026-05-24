from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Reads the JWT access token from an httpOnly cookie instead of the
    Authorization header.  This eliminates XSS exposure because JavaScript
    cannot read httpOnly cookies.

    Cookie name is controlled by settings.SIMPLE_JWT['AUTH_COOKIE']
    (default: 'access_token').
    """

    def authenticate(self, request):
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)

        if raw_token is None:
            # No cookie present — not authenticated (let DRF return 401)
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
