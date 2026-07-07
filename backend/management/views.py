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
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import (
    Client, Case, Hearing, HearingDocument, Task,
    Payment, Invoice, UserProfile, ConsultationRequest
)
from .serializers import (
    ClientSerializer, CaseSerializer, HearingSerializer, HearingDocumentSerializer,
    TaskSerializer, InvoiceSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    ConsultationRequestSerializer, PaymentSerializer
)

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
            .filter(case__client=client)
            .select_related('case', 'case__client')
            .order_by('-payment_date')
        )

        return Response({
            "client":   ClientSerializer(client).data,
            "cases":    CaseSerializer(cases, many=True).data,
            "hearings": HearingSerializer(hearings, many=True).data,
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
        })


# ── Client ViewSet ────────────────────────────────────────────────────────────

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsStaffUser]
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
                client.portal_password = raw_password
                client.save(update_fields=['user', 'portal_password'])
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
        
        client.portal_password = new_password
        client.save(update_fields=['portal_password'])

        return Response({
            'portal_username': client.client_number,
            'portal_password': new_password,
        })


# ── Case ViewSet ──────────────────────────────────────────────────────────────

class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['case_number', 'opponent_name', 'court']

    def get_queryset(self):
        qs = Case.objects.all().select_related('client', 'assigned_to').order_by('-created_at')
        user = self.request.user
        role = getattr(user.profile, 'role', '')
        if role == 'Associate':
            qs = qs.filter(assigned_to=user)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.annotate(
                similarity=Greatest(
                    TrigramSimilarity('case_number', search),
                    TrigramSimilarity('opponent_name', search),
                    TrigramSimilarity('court', search),
                    TrigramSimilarity('client__name', search),
                )
            ).filter(similarity__gt=0.1).order_by('-similarity')
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# ── Hearing ViewSet ───────────────────────────────────────────────────────────

class HearingViewSet(viewsets.ModelViewSet):
    serializer_class = HearingSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = (
            Hearing.objects
            .select_related('case', 'case__client', 'case__assigned_to')
            .prefetch_related('documents')
            .order_by('hearing_date')
        )
        user = self.request.user
        role = getattr(user.profile, 'role', '')
        if role == 'Associate':
            qs = qs.filter(case__assigned_to=user)

        district = self.request.query_params.get('district')
        tehsil   = self.request.query_params.get('tehsil')
        court    = self.request.query_params.get('court')
        date_str = self.request.query_params.get('date')

        if district:
            qs = qs.filter(case__district__iexact=district)
        if tehsil:
            qs = qs.filter(case__tehsil__iexact=tehsil)
        if court:
            qs = qs.filter(case__court__iexact=court)
        if date_str:
            qs = qs.filter(hearing_date=date_str)

        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# ── HearingDocument ViewSet ───────────────────────────────────────────────────

class HearingDocumentViewSet(viewsets.ModelViewSet):
    queryset = (
        HearingDocument.objects
        .select_related('hearing', 'hearing__case')
        .order_by('-uploaded_at')
    )
    serializer_class = HearingDocumentSerializer
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=True, methods=['get'], url_path='presigned_url')
    def presigned_url(self, request, pk=None):
        """
        Returns a 15-minute pre-signed S3 URL for a document.
        In local dev (USE_S3=False) returns the raw media path instead.
        """
        doc = self.get_object()

        use_s3 = getattr(settings, 'USE_S3', False)
        if not use_s3:
            request_obj = request._request
            file_url = request_obj.build_absolute_uri(doc.file.url)
            return Response({'url': file_url, 'expires_in': None})

        if boto3 is None:
            return Response(
                {'error': 'S3 support is not installed (boto3 missing).'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            presigned = s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': str(doc.file),
                },
                ExpiresIn=900,
            )
        except BotoCoreClientError as e:
            return Response(
                {'error': 'Could not generate download link.', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'url': presigned, 'expires_in': 900})


# ── Task ViewSet ──────────────────────────────────────────────────────────────

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('is_completed', '-created_at')
    serializer_class = TaskSerializer
    permission_classes = [IsStaffUser]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


# ── Payment ViewSet ───────────────────────────────────────────────────────────

class PaymentViewSet(viewsets.ModelViewSet):
    """
    Creating or deleting a payment automatically recalculates the linked
    invoice status via Payment.save() / Payment.delete() — both wrapped in
    transaction.atomic() at the model level.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'profile', None), 'role', '')
        if role == 'Associate':
            # Associates are not permitted to view financial records.
            # Return none() here; list/retrieve actions will return empty 200.
            # The 403 is enforced by check_permissions() below.
            return Payment.objects.none()
        return (
            Payment.objects
            .select_related('case', 'case__client')
            .order_by('-payment_date')
        )

    def check_permissions(self, request):
        super().check_permissions(request)
        # Associates must not create, update, or delete payments.
        role = getattr(getattr(request.user, 'profile', None), 'role', '')
        if role == 'Associate' and request.method not in ('GET', 'HEAD', 'OPTIONS'):
            self.permission_denied(
                request,
                message="Associates are not permitted to modify payment records.",
                code='associate_forbidden',
            )

    @transaction.atomic
    def create(self, request, *args, **kwargs):

        """
        Validate amount and outstanding balance inside a SINGLE atomic block
        with a row-level lock on the Case to prevent two concurrent payments
        from both passing the outstanding-balance check and causing overpayment.

        Flow:
          1. Validate serializer fields.
          2. Lock the Case row with select_for_update().
          3. Re-read total_paid inside the lock (eliminates the TOCTOU window).
          4. Save the payment (Payment.save() joins this transaction).
          5. Invoice status is recalculated atomically in the same transaction.
        """
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data.get('amount_received', 0)
        case   = serializer.validated_data.get('case')

        if amount <= 0:
            return _error("Payment amount must be greater than zero.")

        # Lock the Case row for the duration of this transaction so no other
        # concurrent request can insert a payment for this case until we commit.
        try:
            case = Case.objects.select_for_update().get(pk=case.pk)
        except Case.DoesNotExist:
            return _error("Case not found.", status.HTTP_404_NOT_FOUND)

        # Re-read total_paid INSIDE the lock to get a consistent view.
        total_paid = (
            Payment.objects
            .filter(case=case)
            .aggregate(total=Sum('amount_received'))['total']
            or 0
        )
        outstanding = case.total_fee - total_paid

        if outstanding <= 0:
            return _error("This case is already fully paid.")

        if amount > outstanding:
            return Response(
                {
                    "error": "Payment exceeds outstanding balance.",
                    "outstanding_balance": float(outstanding),
                    "attempted_payment":   float(amount),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Pass the locked case object so serializer.save() uses it directly.
            payment = serializer.save(case=case)
        except Exception as e:
            return _error(f"Could not record payment: {str(e)}")

        return Response(
            self.get_serializer(payment).data,
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """
        Payment.delete() already handles atomic invoice recalculation.
        """
        return super().destroy(request, *args, **kwargs)


# ── Invoice ViewSet ───────────────────────────────────────────────────────────

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        user = self.request.user
        role = getattr(getattr(user, 'profile', None), 'role', '')
        if role == 'Associate':
            return Invoice.objects.none()
        return (
            Invoice.objects
            .select_related('case', 'case__client')
            .order_by('-created_at')
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        After creating an invoice, immediately recalculate its status based on
        any payments already recorded for the same case.
        """
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            invoice_id = response.data.get('id')
            try:
                invoice = Invoice.objects.get(pk=invoice_id)
                Invoice.recalculate_status_for_case(invoice.case)
                response.data = self.get_serializer(
                    Invoice.objects.select_related('case', 'case__client').get(pk=invoice_id)
                ).data
            except Invoice.DoesNotExist:
                pass
        return response

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        After updating an invoice (e.g. amount change), recalculate status
        so a reduced amount correctly flips Partial -> Paid, etc.
        """
        response = super().update(request, *args, **kwargs)
        if response.status_code in (status.HTTP_200_OK, status.HTTP_206_PARTIAL_CONTENT):
            invoice_id = response.data.get('id')
            try:
                invoice = Invoice.objects.get(pk=invoice_id)
                Invoice.recalculate_status_for_case(invoice.case)
                response.data = self.get_serializer(
                    Invoice.objects.select_related('case', 'case__client').get(pk=invoice_id)
                ).data
            except Invoice.DoesNotExist:
                pass
        return response

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in (Invoice.STATUS_PAID, Invoice.STATUS_PARTIAL):
            return Response(
                {"error": "A paid or partially paid challan cannot be deleted. Please reverse or delete the associated payments first to mark it unpaid."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


# ── Consultation ViewSet ──────────────────────────────────────────────────────

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = ConsultationRequest.objects.all().order_by('-created_at')
    serializer_class = ConsultationRequestSerializer
    throttle_scope = 'consultation'

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

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

class AccountsLedgerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user.profile, 'role', '')
        if role == 'Associate':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        total_billed   = Invoice.objects.aggregate(total=Sum('amount'))['total'] or 0
        total_received = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
        outstanding    = total_billed - total_received

        monthly_payments = (
            Payment.objects
            .annotate(month=TruncMonth('payment_date'))
            .values('month')
            .annotate(total=Sum('amount_received'))
            .order_by('month')
        )

        revenue_chart = [
            {
                "month":   p['month'].strftime('%b %Y') if p['month'] else 'Unknown',
                "revenue": p['total'],
            }
            for p in monthly_payments
        ]

        return Response({
            "total_billed":        total_billed,
            "total_received":      total_received,
            "outstanding_balance": outstanding,
            "revenue_chart":       revenue_chart,
        }, status=status.HTTP_200_OK)


# ── Daily Diary ───────────────────────────────────────────────────────────────

class DailyDiaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user.profile, 'role', '')
        if role == 'Accountant':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        today    = date.today()
        hearings = (
            Hearing.objects
            .filter(hearing_date=today)
            .select_related('case', 'case__client')
            .prefetch_related('documents')
        )
        if role == 'Associate':
            hearings = hearings.filter(case__assigned_to=request.user)
        return Response(HearingSerializer(hearings, many=True).data, status=status.HTTP_200_OK)


# ── Dashboard Stats ───────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        role = getattr(request.user.profile, 'role', '')
        perms = getattr(request.user.profile, 'permissions', {})
        has_accounts_view = role == 'Admin' or perms.get('accounts', {}).get('view', False)

        response_data = {
            "active_cases":    Case.objects.filter(status__iexact='active').count(),
            "total_clients":   Client.objects.count(),
            "todays_hearings": Hearing.objects.filter(hearing_date=today).count(),
            "total_revenue":   Case.objects.aggregate(total=Sum('total_fee'))['total'] or 0,
        }

        if has_accounts_view:
            current_month_billed = Invoice.objects.filter(
                issue_date__year=today.year,
                issue_date__month=today.month
            ).aggregate(total=Sum('amount'))['total'] or 0

            current_month_collected = Payment.objects.filter(
                payment_date__year=today.year,
                payment_date__month=today.month
            ).aggregate(total=Sum('amount_received'))['total'] or 0

            overall_billed    = Invoice.objects.aggregate(total=Sum('amount'))['total'] or 0
            overall_collected = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
            overall_remaining = overall_billed - overall_collected

            monthly_billing = (
                Invoice.objects
                .annotate(month=TruncMonth('issue_date'))
                .values('month')
                .annotate(total=Sum('amount'))
                .order_by('-month')[:6]
            )
            billing_trend = [
                {
                    "month":  b['month'].strftime('%b %Y') if b['month'] else 'Unknown',
                    "amount": float(b['total'])
                }
                for b in reversed(list(monthly_billing))
            ]

            monthly_collections = (
                Payment.objects
                .annotate(month=TruncMonth('payment_date'))
                .values('month')
                .annotate(total=Sum('amount_received'))
                .order_by('-month')[:6]
            )
            collections_trend = [
                {
                    "month":  c['month'].strftime('%b %Y') if c['month'] else 'Unknown',
                    "amount": float(c['total'])
                }
                for c in reversed(list(monthly_collections))
            ]

            response_data["accounts_stats"] = {
                "current_month_billed":    float(current_month_billed),
                "current_month_collected": float(current_month_collected),
                "overall_billed":          float(overall_billed),
                "overall_collected":       float(overall_collected),
                "overall_remaining":       float(overall_remaining),
                "billing_trend":           billing_trend,
                "collections_trend":       collections_trend,
            }

        return Response(response_data, status=status.HTTP_200_OK)


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        logs = []
        for model in [Client, Case, Hearing, Invoice]:
            for record in model.history.all().select_related('history_user').order_by('-history_date')[:50]:
                action_label = (
                    'Created' if record.history_type == '+' else
                    'Updated' if record.history_type == '~' else
                    'Deleted'
                )
                user_name = record.history_user.username if record.history_user else 'System'

                ident = getattr(record, 'case_number', getattr(record, 'invoice_number', getattr(record, 'id', '')))
                if model.__name__ == 'Client':
                    name = getattr(record, 'name', '')
                    num  = getattr(record, 'client_number', '')
                    ident = f"{num} - {name}" if num else name
                elif model.__name__ == 'Hearing':
                    # Historical records store FK as a plain ID, not a live object.
                    # Accessing record.case.case_number would trigger an extra query
                    # per entry and can raise AttributeError on deleted cases.
                    case_id = getattr(record, 'case_id', None)
                    ident = f"for Case ID {case_id}" if case_id else 'Unknown Case'

                logs.append({
                    'id':      record.history_id,
                    'model':   model.__name__,
                    'action':  action_label,
                    'user':    user_name,
                    'date':    record.history_date,
                    'details': f"{action_label} {model.__name__} {ident}",
                })

        logs.sort(key=lambda x: x['date'], reverse=True)
        return Response(logs[:100], status=status.HTTP_200_OK)


# ── System Ping (Keep-alive) ──────────────────────────────────────────────────

class PingView(APIView):
    """Zero-overhead endpoint to keep the Render server awake."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "active",
            "system": "Legal Office Backend Awake"
        }, status=status.HTTP_200_OK)