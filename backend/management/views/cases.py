from .users import IsStaffUser
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
from ..models import (
    Client, Case, Hearing, HearingDocument, Task,
    Payment, Invoice, Expense, UserProfile, ConsultationRequest, CaseTimeline, Court, Judge, CalendarEvent, Notification, Deadline
)
from ..serializers import (
    ClientSerializer, CaseSerializer, HearingSerializer, HearingDocumentSerializer,
    TaskSerializer, InvoiceSerializer, UserSerializer, CustomTokenObtainPairSerializer,
    PaymentSerializer, ExpenseSerializer, ConsultationRequestSerializer, CaseTimelineSerializer, CourtSerializer, JudgeSerializer, CalendarEventSerializer, NotificationSerializer, DeadlineSerializer
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


class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['case_number', 'opponent_name', 'court__name']

    def get_queryset(self):
        qs = Case.objects.all().select_related('client', 'assigned_to', 'court', 'judge').order_by('-created_at')
        user = self.request.user
        role = getattr(user.profile, 'role', '')
        if role == 'Associate':
            qs = qs.filter(assigned_to=user)

        category = self.request.query_params.get('category', '').strip()
        priority = self.request.query_params.get('priority', '').strip()
        status_param = self.request.query_params.get('status', '').strip()

        if category:
            qs = qs.filter(category__iexact=category)
        if priority:
            qs = qs.filter(priority__iexact=priority)
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.annotate(
                similarity=Greatest(
                    TrigramSimilarity('case_number', search),
                    TrigramSimilarity('opponent_name', search),
                    TrigramSimilarity('court__name', search),
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


# ── CaseTimeline ViewSet ────────────────────────────────────────────────────────
class CaseTimelineViewSet(viewsets.ModelViewSet):
    serializer_class = CaseTimelineSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = CaseTimeline.objects.select_related('actor').order_by('-timestamp')
        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
            
        role = getattr(self.request.user.profile, 'role', '')
        if role == 'Associate':
            qs = qs.filter(case__assigned_to=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        case_id = request.data.get('case')
        if not case_id:
            return _error("case is required.")
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return _error("Case not found.", status.HTTP_404_NOT_FOUND)

        role = getattr(request.user.profile, 'role', '')
        if role != 'Admin' and case.assigned_to != request.user:
            return _error("Only Admins and the Assigned Advocate can add manual notes.", status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['activity_type'] = 'Note'
        data['actor'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ── Conflict Check View ────────────────────────────────────────────────────────
class ConflictCheckView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"clients": [], "opponents": []})
            
        client_matches = Client.objects.annotate(
            similarity=Greatest(
                TrigramSimilarity('name', query),
                TrigramSimilarity('cnic', query),
                TrigramSimilarity('mobile_number', query)
            )
        ).filter(Q(similarity__gt=0.3) | Q(name__icontains=query) | Q(cnic__icontains=query)).order_by('-similarity')[:5]
        
        opponent_matches = Case.objects.annotate(
            similarity=TrigramSimilarity('opponent_name', query)
        ).filter(Q(similarity__gt=0.3) | Q(opponent_name__icontains=query)).select_related('client').order_by('-similarity')[:5]
        
        return Response({
            "clients": ClientSerializer(client_matches, many=True).data,
            "opponents": CaseSerializer(opponent_matches, many=True).data
        })


# ── Hearing ViewSet ───────────────────────────────────────────────────────────

class HearingViewSet(viewsets.ModelViewSet):
    serializer_class = HearingSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        from django.db.models import OuterRef, Subquery
        
        previous_hearing = Hearing.objects.filter(
            case=OuterRef('case'),
            hearing_date__lt=OuterRef('hearing_date')
        ).order_by('-hearing_date').values('hearing_date')[:1]

        qs = (
            Hearing.objects
            .select_related('case', 'case__client', 'case__assigned_to', 'case__court', 'case__judge')
            .prefetch_related('documents')
            .annotate(annotated_previous_date=Subquery(previous_hearing))
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
        month    = self.request.query_params.get('month')
        year     = self.request.query_params.get('year')

        if district:
            qs = qs.filter(case__court__district__iexact=district)
        if tehsil:
            qs = qs.filter(case__court__tehsil__iexact=tehsil)
        if court:
            qs = qs.filter(case__court__name__iexact=court)
        if date_str:
            qs = qs.filter(hearing_date=date_str)
        if month:
            qs = qs.filter(hearing_date__month=month)
        if year:
            qs = qs.filter(hearing_date__year=year)

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

    def create(self, request, *args, **kwargs):
        import traceback
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            error_details = traceback.format_exc()
            print(error_details)
            return Response(
                {"error": str(e), "traceback": error_details},
                status=500
            )

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

class CourtViewSet(viewsets.ModelViewSet):
    queryset = Court.objects.all().order_by('name')
    serializer_class = CourtSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'type', 'district', 'tehsil']

    def destroy(self, request, *args, **kwargs):
        from django.db.models import RestrictedError, ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except (RestrictedError, ProtectedError):
            return _error("Cannot delete this court because it is assigned to one or more active cases.", status.HTTP_400_BAD_REQUEST)

class JudgeViewSet(viewsets.ModelViewSet):
    queryset = Judge.objects.all().order_by('name')
    serializer_class = JudgeSerializer
    permission_classes = [IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'court__name']

    def destroy(self, request, *args, **kwargs):
        from django.db.models import RestrictedError, ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except (RestrictedError, ProtectedError):
            return _error("Cannot delete this judge because they are assigned to one or more active hearings.", status.HTTP_400_BAD_REQUEST)

