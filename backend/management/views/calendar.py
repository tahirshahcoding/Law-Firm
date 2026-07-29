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


class TaskViewSet(viewsets.ModelViewSet):
    required_module = 'diary'
    serializer_class = TaskSerializer
    permission_classes = [IsStaffUser, HasModulePermission]

    def get_queryset(self):
        qs = Task.objects.all().order_by('is_completed', '-created_at')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(due_date__icontains=search)
            ).distinct()
        is_completed = self.request.query_params.get('is_completed')
        if is_completed is not None and is_completed != '':
            val = is_completed.lower() in ('true', '1', 'yes')
            qs = qs.filter(is_completed=val)
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


# ── Court ViewSet ─────────────────────────────────────────────────────────────

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = CalendarEvent.objects.select_related(
            'case', 'case__client', 'case__court', 'case__judge', 'case__assigned_to', 'client', 'assigned_to'
        ).order_by('start_date')
        
        # Filter by date range (start/end)
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(start_date__lte=end)
            
        # Manual filters
        event_type = self.request.query_params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)
            
        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
            
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
            
        assigned_to_id = self.request.query_params.get('assigned_to')
        if assigned_to_id:
            qs = qs.filter(assigned_to_id=assigned_to_id)
            
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search) |
                Q(case__case_number__icontains=search) |
                Q(client__name__icontains=search)
            ).distinct()

        return qs


# ── Notification ViewSet ──────────────────────────────────────────────────────

class DeadlineViewSet(viewsets.ModelViewSet):
    serializer_class = DeadlineSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', '')
        
        qs = Deadline.objects.select_related('case', 'assigned_to', 'case__client').all()
        
        # If not Admin/Accountant/Manager, maybe restrict to their own assigned deadlines and cases
        if role not in ('Admin', 'Manager', 'Accountant'):
            # Only see deadlines assigned to them or their cases
            qs = qs.filter(Q(assigned_to=user) | Q(case__assigned_to=user))

        # Filters
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
            
        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)
            
        case_id = self.request.query_params.get('case')
        if case_id:
            qs = qs.filter(case_id=case_id)
            
        assigned_to_id = self.request.query_params.get('assigned_to')
        if assigned_to_id:
            qs = qs.filter(assigned_to_id=assigned_to_id)
            
        deadline_type = self.request.query_params.get('deadline_type')
        if deadline_type:
            qs = qs.filter(deadline_type=deadline_type)
            
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(case__case_number__icontains=search) |
                Q(case__client__name__icontains=search) |
                Q(assigned_to__username__icontains=search) |
                Q(assigned_to__first_name__icontains=search) |
                Q(assigned_to__last_name__icontains=search)
            ).distinct()

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Count, Q
        
        qs = self.get_queryset()
        today = timezone.now().date()
        week_from_now = today + timedelta(days=7)
        
        summary = qs.aggregate(
            today=Count('id', filter=Q(due_date=today) & ~Q(status='Completed')),
            week=Count('id', filter=Q(due_date__gte=today, due_date__lte=week_from_now) & ~Q(status='Completed')),
            overdue=Count('id', filter=Q(due_date__lt=today) & ~Q(status='Completed')),
            completed=Count('id', filter=Q(status='Completed')),
        )
        
        return Response({
            "today": summary['today'] or 0,
            "week": summary['week'] or 0,
            "overdue": summary['overdue'] or 0,
            "completed": summary['completed'] or 0
        })

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        deadline = self.get_object()
        deadline.status = 'Completed'
        deadline.save(update_fields=['status'])
        return Response({"status": "success", "message": "Deadline marked as completed."})