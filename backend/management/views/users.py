import json
import secrets
import string
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import filters
from datetime import date
from django.db import transaction, IntegrityError
from django.db.models import Sum, Q
from django.db.models.functions import Greatest, TruncMonth
from django.contrib.postgres.search import TrigramSimilarity
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.core.exceptions import ValidationError
from ..models import (
    Client, Case, Hearing, HearingDocument, Task,
    Payment, Invoice, Expense, UserProfile, ConsultationRequest, CaseTimeline, Court, Judge, CalendarEvent, Notification, Deadline, Message
)
from ..serializers import (
    ClientSerializer, CaseSerializer, HearingSerializer, HearingDocumentSerializer,
    TaskSerializer, InvoiceSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    PaymentSerializer, ExpenseSerializer, ConsultationRequestSerializer, CaseTimelineSerializer, CourtSerializer, JudgeSerializer, CalendarEventSerializer, NotificationSerializer, DeadlineSerializer
)
from ..permissions import HasModulePermission

try:
    import boto3
    from botocore.exceptions import ClientError as BotoCoreClientError
except ImportError:
    boto3 = None  # type: ignore[assignment]
    BotoCoreClientError = Exception  # type: ignore[misc,assignment]

# ── Shared error handler ──────────────────────────────────────────────────────

def _error(msg, code=status.HTTP_400_BAD_REQUEST):
    """Return a consistent DRF error Response."""
    return Response({"error": msg}, status=code)


# ── Custom Permissions ────────────────────────────────────────────────────────

class IsStaffUser(BasePermission):
    """
    Allows access only to authenticated users who have a staff UserProfile
    (role = Admin / Associate / Accountant / Staff).

    Blocks client portal accounts — Client users have a `client_profile`
    relation but no `profile` (UserProfile), so they are refused access to all
    staff-only ViewSets even though they hold a valid JWT cookie.
    """
    message = "Access restricted to staff accounts."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # A staff user always has a UserProfile (OneToOne via 'profile').
        # Client portal users have 'client_profile' but no 'profile'.
        return hasattr(request.user, 'profile')


# ── JWT cookie helpers ────────────────────────────────────────────────────────

def _set_jwt_cookies(response, access_token, refresh_token=None):
    """Attach JWT tokens as httpOnly cookies to a DRF Response."""
    jwt_settings = settings.SIMPLE_JWT
    cookie_kwargs = dict(
        httponly=jwt_settings.get('AUTH_COOKIE_HTTP_ONLY', True),
        secure=jwt_settings.get('AUTH_COOKIE_SECURE', not settings.DEBUG),
        samesite=jwt_settings.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        path=jwt_settings.get('AUTH_COOKIE_PATH', '/'),
        domain=jwt_settings.get('AUTH_COOKIE_DOMAIN', None),
    )
    access_name  = jwt_settings.get('AUTH_COOKIE', 'access_token')
    refresh_name = jwt_settings.get('AUTH_COOKIE_REFRESH', 'refresh_token')

    access_max_age = int(jwt_settings['ACCESS_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(access_name, access_token, max_age=access_max_age, **cookie_kwargs)

    if refresh_token is not None:
        refresh_max_age = int(jwt_settings['REFRESH_TOKEN_LIFETIME'].total_seconds())
        response.set_cookie(refresh_name, refresh_token, max_age=refresh_max_age, **cookie_kwargs)

    return response


def _delete_jwt_cookies(response):
    """Delete JWT cookies from the client by setting max_age=0."""
    jwt_settings = settings.SIMPLE_JWT
    access_name  = jwt_settings.get('AUTH_COOKIE', 'access_token')
    refresh_name = jwt_settings.get('AUTH_COOKIE_REFRESH', 'refresh_token')
    response.delete_cookie(access_name)
    response.delete_cookie(refresh_name)
    return response


# ── Auth Views ────────────────────────────────────────────────────────────────

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint: validates credentials and sets the JWT tokens as httpOnly
    cookies instead of returning them in the JSON body.
    The browser automatically sends these cookies with every subsequent request,
    and JavaScript cannot read them — eliminating XSS token theft.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        tokens = serializer.validated_data
        response = Response({'detail': 'Login successful.'}, status=status.HTTP_200_OK)
        _set_jwt_cookies(response, tokens['access'], tokens.get('refresh'))
        return response


class TokenRefreshCookieView(APIView):
    """
    Refresh endpoint: reads the refresh token from the httpOnly cookie, issues
    a new access token, and sets it back as a cookie.
    """
    permission_classes = []

    def post(self, request):
        refresh_name = settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        raw_refresh   = request.COOKIES.get(refresh_name)

        if not raw_refresh:
            return _error('Refresh token not found.', status.HTTP_401_UNAUTHORIZED)

        try:
            token   = RefreshToken(raw_refresh)
            access  = str(token.access_token)
            refresh = str(token) if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS') else None
        except TokenError as e:
            return _error(str(e), status.HTTP_401_UNAUTHORIZED)

        response = Response({'detail': 'Token refreshed.'}, status=status.HTTP_200_OK)
        _set_jwt_cookies(response, access, refresh)
        return response


class LogoutView(APIView):
    """
    Logout endpoint: instructs the browser to delete the JWT cookies.
    Even if the client ignores the response, cookies expire naturally.
    """
    permission_classes = []

    def post(self, request):
        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        _delete_jwt_cookies(response)
        return response


# ── User Management ───────────────────────────────────────────────────────────

class AdminUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)
        users = User.objects.all().select_related('profile')
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @transaction.atomic
    def post(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        data = request.data
        
        try:
            validate_password(data['password'])
        except ValidationError as e:
            return _error(f"Weak password: {', '.join([str(m) for m in e.messages])}", status.HTTP_400_BAD_REQUEST)

        # Both User + UserProfile must succeed or both must roll back.
        try:
            user = User.objects.create_user(
                username=data['username'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                email=data.get('email', '')
            )
            UserProfile.objects.create(
                user=user,
                role=data.get('role', 'Staff'),
                permissions=data.get('permissions', {})
            )
            return Response(
                UserSerializer(user, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except IntegrityError:
            return _error("A user with that username already exists.")
        except KeyError as e:
            return _error(f"Missing required field: {e}")
        except ValueError as e:
            return _error(f"Invalid value: {e}")


class AdvocatesView(APIView):
    """Returns a list of users who can be assigned to cases as advocates."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.exclude(
            client_profile__isnull=False
        ).select_related('profile').distinct()
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def put(self, request, pk):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.select_for_update().get(pk=pk)
        except User.DoesNotExist:
            return _error("User not found", status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'username' in data and data['username'].strip():
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return _error("Username is already taken.")
            user.username = data['username'].strip()

        for field in ('first_name', 'last_name', 'email'):
            if field in data:
                setattr(user, field, data[field])

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        user.save()

        profile = getattr(user, 'profile', None)
        if profile:
            if 'role' in data:
                profile.role = data['role']
            if 'permissions' in data:
                perms = data['permissions']
                if isinstance(perms, str):
                    try:
                        perms = json.loads(perms)
                    except ValueError:
                        perms = None
                if perms is not None:
                    profile.permissions = perms
            if 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']
            profile.save()

        return Response(UserSerializer(user, context={'request': request}).data)

    @transaction.atomic
    def delete(self, request, pk):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        if request.user.id == pk:
            return _error("Cannot delete yourself")

        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return _error("User not found", status.HTTP_404_NOT_FOUND)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def post(self, request):
        return self.put(request)

    @transaction.atomic
    def put(self, request):
        user = request.user
        data = request.data

        if 'username' in data and data['username'].strip():
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return _error("Username is already taken.")
            user.username = data['username'].strip()

        if 'email' in data:
            user.email = data['email'].strip()

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        user.save()

        profile = user.profile if hasattr(user, 'profile') else None
        if profile and 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
            profile.save()

        return Response(UserSerializer(user, context={'request': request}).data)


# ── Client Portal ─────────────────────────────────────────────────────────────

class ClientPortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'client_profile') or not user.client_profile:
            return _error("Only clients can access this portal.", status.HTTP_403_FORBIDDEN)

        client   = user.client_profile
        cases    = Case.objects.filter(client=client).select_related('client').order_by('-created_at')
        hearings = (
            Hearing.objects
            .filter(case__client=client)
            .select_related('case', 'case__client')
            .order_by('hearing_date')
        )
        invoices = (
            Invoice.objects
            .filter(case__client=client)
            .select_related('case', 'case__client')
            .order_by('-issue_date')
        )
        payments = (
            Payment.objects
            .filter(invoice__case__client=client)
            .select_related('invoice__case', 'invoice__case__client')
            .order_by('-payment_date')
        )

        unread_messages_count = Message.objects.filter(client=client, sender_type='Staff', is_read=False).count()

        return Response({
            "client":   ClientSerializer(client).data,
            "cases":    CaseSerializer(cases, many=True).data,
            "hearings": HearingSerializer(hearings, many=True).data,
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
            "unread_messages_count": unread_messages_count,
        })


# ── Client ViewSet ────────────────────────────────────────────────────────────

class ClientViewSet(viewsets.ModelViewSet):
    required_module = 'clients'
    serializer_class = ClientSerializer
    permission_classes = [IsStaffUser, HasModulePermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'cnic', 'client_number', 'cases__case_number']

    def get_queryset(self):
        qs = Client.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.annotate(
                similarity=Greatest(
                    TrigramSimilarity('name', search),
                    TrigramSimilarity('cnic', search),
                    TrigramSimilarity('client_number', search),
                )
            ).filter(similarity__gt=0.1).order_by('-similarity')
        return qs

    @staticmethod
    def _generate_password(length=12):
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cnic = request.data.get('cnic', '')

        if Client.objects.filter(cnic=cnic).exists():
            return Response(
                {"error": "Conflict Detected: A client with this CNIC is already registered."},
                status=status.HTTP_409_CONFLICT
            )

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # Client save + portal User creation are in the same atomic block.
        # If User creation fails (e.g. duplicate username race), the Client
        # row is rolled back too — no orphaned client records.
        try:
            client = serializer.save()
            raw_password = self._generate_password()
            username = client.client_number

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    password=raw_password,
                    first_name=client.name
                )
                client.user = user
                client.save(update_fields=['user'])
            else:
                raw_password = None
        except IntegrityError as e:
            return _error(f"Could not create client or portal account: {e}")
        except ValueError as e:
            return _error(f"Invalid data: {e}")

        headers = self.get_success_headers(serializer.data)
        response_data = dict(serializer.data)
        response_data['portal_username'] = username
        response_data['portal_password'] = raw_password
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class ClientResetPasswordView(APIView):
    """Admin-only: reset a client's portal password."""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if getattr(request.user, 'profile', None) is None or request.user.profile.role != 'Admin':
            return _error('Forbidden', status.HTTP_403_FORBIDDEN)

        try:
            client = Client.objects.select_for_update().get(pk=pk)
        except Client.DoesNotExist:
            return _error('Client not found', status.HTTP_404_NOT_FOUND)

        if not client.user:
            return _error('This client has no portal account.')

        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        client.user.set_password(new_password)
        client.user.save()

        return Response({
            'portal_username': client.client_number,
            'portal_password': new_password,
        })


# ── Client Password Change ────────────────────────────────────────────────────

class ClientChangePasswordView(APIView):
    """Client-facing API to change their own password from the portal."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'client_profile'):
            return _error("Only clients can change their portal password here.", status.HTTP_403_FORBIDDEN)
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return _error("current_password and new_password are required.", status.HTTP_400_BAD_REQUEST)
            
        if not request.user.check_password(current_password):
            return _error("Incorrect current password.", status.HTTP_400_BAD_REQUEST)
            
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as e:
            return _error(f"Weak password: {', '.join([str(m) for m in e.messages])}", status.HTTP_400_BAD_REQUEST)
            
        try:
            request.user.set_password(new_password)
            request.user.save(update_fields=['password'])
            
            return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return _error(str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)

# ── Case ViewSet ──────────────────────────────────────────────────────────────

class ConsultationViewSet(viewsets.ModelViewSet):
    required_module = 'consultations'
    queryset = ConsultationRequest.objects.all().order_by('-created_at')
    serializer_class = ConsultationRequestSerializer
    throttle_scope = 'consultation'

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsStaffUser(), HasModulePermission()]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Only Admin users can delete consultation requests."""
        profile = getattr(request.user, 'profile', None)
        if getattr(profile, 'role', '') != 'Admin':
            return _error("Forbidden: only admins can delete consultation requests.",
                          status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# ── Accounts Ledger ───────────────────────────────────────────────────────────

