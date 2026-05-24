import secrets
import string
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import filters
from datetime import date
from django.db.models import Sum, Q, Value
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models.functions import Greatest
from django.contrib.auth.models import User
from django.conf import settings
from .models import Client, Case, Hearing, HearingDocument, Task, Payment, Invoice, UserProfile, ConsultationRequest
from .serializers import (
    ClientSerializer, CaseSerializer, HearingSerializer, HearingDocumentSerializer,
    TaskSerializer, InvoiceSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    ConsultationRequestSerializer, PaymentSerializer
)

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

    # Access token lifetime in seconds
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
    permission_classes = []  # No auth required to refresh

    def post(self, request):
        refresh_name = settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        raw_refresh   = request.COOKIES.get(refresh_name)

        if not raw_refresh:
            return Response({'detail': 'Refresh token not found.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token   = RefreshToken(raw_refresh)
            access  = str(token.access_token)
            refresh = str(token) if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS') else None
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response({'detail': 'Token refreshed.'}, status=status.HTTP_200_OK)
        _set_jwt_cookies(response, access, refresh)
        return response


class LogoutView(APIView):
    """
    Logout endpoint: instructs the browser to delete the JWT cookies by setting
    their max_age to 0.  Even if the client ignores the response, the cookies
    expire naturally based on their original max_age.
    """
    permission_classes = []

    def post(self, request):
        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        _delete_jwt_cookies(response)
        return response


# ── User Management ───────────────────────────────────────────────────────────

class AdminUserView(APIView):
    # Only Admin users can manage other users
    permission_classes = [IsAuthenticated]  # role checked manually below

    def get(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        # select_related avoids N+1 hit on profile for each user
        users = User.objects.all().select_related('profile')
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
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
            return Response(UserSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, pk):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        if 'username' in data and data['username'].strip():
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username'].strip()
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        user.save()

        profile = getattr(user, 'profile', None)
        if profile:
            if 'role' in data:
                profile.role = data['role']
            if 'permissions' in data:
                import json
                try:
                    profile.permissions = json.loads(data['permissions'])
                except (ValueError, TypeError):
                    pass
            if 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']
            profile.save()

        return Response(UserSerializer(user, context={'request': request}).data)

    def delete(self, request, pk):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        
        if request.user.id == pk:
            return Response({"error": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def put(self, request):
        user = request.user
        data = request.data

        if 'username' in data and data['username'].strip():
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username'].strip()

        if 'email' in data:
            user.email = data['email'].strip()

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        user.save()

        profile = getattr(user, 'profile', None)
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
            return Response({"error": "Only clients can access this portal."}, status=status.HTTP_403_FORBIDDEN)

        client = user.client_profile
        # select_related('case__client') prevents per-hearing FK lookups
        cases    = Case.objects.filter(client=client).select_related('client').order_by('-created_at')
        hearings = (
            Hearing.objects
            .filter(case__client=client)
            .select_related('case', 'case__client')
            .order_by('hearing_date')
        )

        return Response({
            "client":   ClientSerializer(client).data,
            "cases":    CaseSerializer(cases, many=True).data,
            "hearings": HearingSerializer(hearings, many=True).data,
        })


# ── Client ViewSet ────────────────────────────────────────────────────────────

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
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
        """Generate a cryptographically secure alphanumeric password."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '')
        cnic = request.data.get('cnic', '')

        if Client.objects.filter(cnic=cnic).exists():
            return Response(
                {"error": "Conflict Detected: A client with this CNIC is already registered."},
                status=status.HTTP_409_CONFLICT
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
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
            client.save()
        else:
            raw_password = None

        headers = self.get_success_headers(serializer.data)
        response_data = dict(serializer.data)
        response_data['portal_username'] = username
        response_data['portal_password'] = raw_password
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


class ClientResetPasswordView(APIView):
    """Admin-only: reset a client's portal password."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, 'profile', None) is None or request.user.profile.role != 'Admin':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            client = Client.objects.get(pk=pk)
        except Client.DoesNotExist:
            return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

        if not client.user:
            return Response({'error': 'This client has no portal account.'}, status=status.HTTP_400_BAD_REQUEST)

        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        client.user.set_password(new_password)
        client.user.save()

        return Response({
            'portal_username': client.client_number,
            'portal_password': new_password,
        })


# ── Case ViewSet ──────────────────────────────────────────────────────────────

class CaseViewSet(viewsets.ModelViewSet):
    # select_related('client') collapses the FK into the initial query —
    # prevents 1 extra SQL hit per case when the serializer accesses client fields.
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]
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


# ── Hearing ViewSet ───────────────────────────────────────────────────────────

class HearingViewSet(viewsets.ModelViewSet):
    # select_related('case', 'case__client') satisfies case_number + opponent_name
    # fields in HearingSerializer without extra queries.
    # prefetch_related('documents') fetches all docs for all hearings in 1 query.
    serializer_class = HearingSerializer
    permission_classes = [IsAuthenticated]

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
        return qs


# ── HearingDocument ViewSet ───────────────────────────────────────────────────

from rest_framework.parsers import MultiPartParser, FormParser


class HearingDocumentViewSet(viewsets.ModelViewSet):
    queryset = (
        HearingDocument.objects
        .select_related('hearing', 'hearing__case')
        .order_by('-uploaded_at')
    )
    serializer_class = HearingDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=True, methods=['get'], url_path='presigned_url')
    def presigned_url(self, request, pk=None):
        """
        Returns a 15-minute pre-signed S3 URL for a document.
        Avoids serving files directly from the Render server (which loses files
        on restart and wastes memory).

        In local development (USE_S3=False), returns the raw media path instead.
        """
        doc = self.get_object()

        # ── Local dev fallback ──────────────────────────────────────────────
        use_s3 = getattr(settings, 'USE_S3', False)
        if not use_s3:
            request_obj = request._request  # underlying Django HttpRequest
            file_url = request_obj.build_absolute_uri(doc.file.url)
            return Response({'url': file_url, 'expires_in': None})

        # ── Production: generate Supabase/S3 pre-signed URL ────────────────
        import boto3
        from botocore.exceptions import ClientError

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
                    'Key': str(doc.file),   # the S3 object key stored in the DB
                },
                ExpiresIn=900,  # 15 minutes
            )
        except ClientError as e:
            return Response(
                {'error': 'Could not generate download link.', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'url': presigned, 'expires_in': 900})


# ── Task ViewSet ──────────────────────────────────────────────────────────────

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('is_completed', '-created_at')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]


# ── Payment ViewSet ───────────────────────────────────────────────────────────

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user.profile, 'role', '')
        if role == 'Associate':
            return Payment.objects.none()
        return (
            Payment.objects
            .select_related('case', 'case__client')
            .order_by('-payment_date')
        )


# ── Invoice ViewSet ───────────────────────────────────────────────────────────

class InvoiceViewSet(viewsets.ModelViewSet):
    # select_related('case__client') satisfies client_name + case_number fields
    # in InvoiceSerializer without extra per-invoice queries.
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user.profile, 'role', '')
        if role == 'Associate':
            return Invoice.objects.none() # Associates cannot see invoices

        return (
            Invoice.objects
            .select_related('case', 'case__client')
            .order_by('-created_at')
        )


# ── Consultation ViewSet ──────────────────────────────────────────────────────

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = ConsultationRequest.objects.all().order_by('-created_at')
    serializer_class = ConsultationRequestSerializer
    throttle_scope = 'consultation'

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]


# ── Accounts Ledger ───────────────────────────────────────────────────────────

class AccountsLedgerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(request.user.profile, 'role', '')
        if role == 'Associate':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        total_billed   = Case.objects.aggregate(total=Sum('total_fee'))['total'] or 0
        total_received = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
        outstanding    = total_billed - total_received

        from django.db.models.functions import TruncMonth
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
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        today    = date.today()
        hearings = (
            Hearing.objects
            .filter(hearing_date=today)
            .select_related('case', 'case__client')
            .prefetch_related('documents')
        )
        return Response(HearingSerializer(hearings, many=True).data, status=status.HTTP_200_OK)


# ── Dashboard Stats ───────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        return Response({
            "active_cases":    Case.objects.filter(status__iexact='active').count(),
            "total_clients":   Client.objects.count(),
            "todays_hearings": Hearing.objects.filter(hearing_date=today).count(),
            "total_revenue":   Case.objects.aggregate(total=Sum('total_fee'))['total'] or 0,
        }, status=status.HTTP_200_OK)


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        logs = []
        for model in [Client, Case, Hearing, Invoice]:
            for record in model.history.all().select_related('history_user').order_by('-history_date')[:50]:
                action = 'Created' if record.history_type == '+' else 'Updated' if record.history_type == '~' else 'Deleted'
                user_name = record.history_user.username if record.history_user else 'System'
                
                # Try to get a human-readable identifier
                ident = getattr(record, 'case_number', getattr(record, 'invoice_number', getattr(record, 'id', '')))
                if model.__name__ == 'Client':
                    name = getattr(record, 'name', '')
                    num  = getattr(record, 'client_number', '')
                    ident = f"{num} – {name}" if num else name
                elif model.__name__ == 'Hearing':
                    ident = f"for Case {record.case.case_number if hasattr(record, 'case') and record.case else 'Unknown'}"
                
                logs.append({
                    'id': record.history_id,
                    'model': model.__name__,
                    'action': action,
                    'user': user_name,
                    'date': record.history_date,
                    'details': f"{action} {model.__name__} {ident}"
                })
        
        logs.sort(key=lambda x: x['date'], reverse=True)
        return Response(logs[:100], status=status.HTTP_200_OK)