"""
Django settings for core project.
Reads all secrets from environment variables — safe for production.
"""

import os
from pathlib import Path
from datetime import timedelta
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

from dotenv import load_dotenv
load_dotenv(BASE_DIR.parent / '.env')

# ── Security ─────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-local-dev-key-change-in-production'
)

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS_ENV = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS_ENV.split(',') if h.strip()]

# Hugging Face Spaces automatically sets the SPACE_ID environment variable.
# We add '*' to ALLOWED_HOSTS so the Space can be accessed via the Hugging Face domain.
if os.environ.get('SPACE_ID'):
    ALLOWED_HOSTS.append('*')
elif not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']

# ── Installed Apps ────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    # Token blacklist is required for BLACKLIST_AFTER_ROTATION = True.
    # Without it, old refresh tokens are never invalidated after rotation.
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'storages',
    'simple_history',
    'django.contrib.postgres',
    'management',
]

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',       # serve static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

ROOT_URLCONF = 'core.urls'

# Prevent Django from throwing RuntimeError on POST requests missing a trailing
# slash. The Next.js proxy sometimes strips trailing slashes, and Django's
# APPEND_SLASH redirect cannot preserve POST body — causing a 500 error.
APPEND_SLASH = False

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
# Reads DATABASE_URL env var in production (Neon), falls back to local Postgres
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            # Re-validate persistent connections before reuse so a Neon cold start
            # (where the DB scales to zero) doesn't cause a 500 on the first request.
            conn_health_checks=True,
            ssl_require=True,
        )
    }
else:
    # Local Docker Compose setup
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', 'legal_office_db'),
            'USER': os.environ.get('POSTGRES_USER', 'admin'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'supersecurepassword123'),
            'HOST': os.environ.get('POSTGRES_HOST', 'db'),
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        }
    }

# ── Password Validation ───────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Karachi'
USE_I18N = True
USE_TZ = True

# ── Static Files ──────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ---------------------------------------------------------
# DYNAMIC STORAGE ENGINE (Local vs. Production)
# ---------------------------------------------------------
# Force local storage in DEBUG mode unless USE_S3 is explicitly 'True'
USE_S3 = os.environ.get('USE_S3') == 'True'

if USE_S3 and not DEBUG:
    # --- PRODUCTION (Render + Supabase S3) ---
    AWS_ACCESS_KEY_ID = os.environ.get('SUPABASE_S3_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = os.environ.get('SUPABASE_S3_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('SUPABASE_S3_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = os.environ.get('SUPABASE_S3_ENDPOINT')
    AWS_S3_REGION_NAME = os.environ.get('SUPABASE_S3_REGION')

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "access_key": AWS_ACCESS_KEY_ID,
                "secret_key": AWS_SECRET_ACCESS_KEY,
                "bucket_name": AWS_STORAGE_BUCKET_NAME,
                "endpoint_url": AWS_S3_ENDPOINT_URL,
                "region_name": AWS_S3_REGION_NAME,
            },
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    # --- LOCAL DEVELOPMENT (Disk Storage) ---
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }



# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS_ENV = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,https://lawsiteswat.vercel.app,https://rahimullahadv.vercel.app,https://clientcounsel.vercel.app'
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in CORS_ALLOWED_ORIGINS_ENV.split(',') if o.strip()]

# Add Vercel domains to trusted origins so Django accepts the proxied POST
CSRF_TRUSTED_ORIGINS = [
    "https://rahimullahadv.vercel.app",
    "https://clientcounsel.vercel.app",
    "https://lawsiteswat.vercel.app"
]

# Allow CORS on both API and media file paths (so browser can load avatar images)
CORS_URLS_REGEX = r'^/(api|media)/.*$'

# Required for cookie-based auth — browser must send credentials with cross-origin requests
CORS_ALLOW_CREDENTIALS = True

# Ensure Django uses the client-facing host (localhost:8000) when building absolute
# URIs inside Docker, rather than the internal container hostname
USE_X_FORWARDED_HOST = True

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Reads JWT from the httpOnly 'access_token' cookie instead of the
        # Authorization header — immune to XSS token theft.
        'management.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'PAGE_SIZE_QUERY_PARAM': 'limit',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'user': '1000/minute',
        'login': '10/minute',
        'consultation': '10/minute',
    },
    'EXCEPTION_HANDLER': 'management.exceptions.custom_exception_handler',
}

# ── JWT ───────────────────────────────────────────────────────────────────────
# Cookie security: Lax in local dev (same-origin), None+Secure in production
# (cross-origin between Vercel frontend and Render backend).
_COOKIE_SAMESITE = 'Lax' if DEBUG else 'None'
_COOKIE_SECURE   = not DEBUG  # True in production (HTTPS only)

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    # ── Cookie settings (used by CookieJWTAuthentication + login view) ──
    'AUTH_COOKIE':          'access_token',
    'AUTH_COOKIE_REFRESH':  'refresh_token',
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SECURE':    _COOKIE_SECURE,
    'AUTH_COOKIE_SAMESITE':  _COOKIE_SAMESITE,
    'AUTH_COOKIE_PATH':      '/',
    'AUTH_COOKIE_DOMAIN':    None,  # None = same domain; set to '.yourdomain.com' for subdomains
}

# ── Production Security Headers ───────────────────────────────────────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
