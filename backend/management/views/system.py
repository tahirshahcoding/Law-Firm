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
        has_accounts_view = role == 'Admin' or role == 'Accountant' or perms.get('accounts', {}).get('view', False)

        # Base response for all users
        response_data = {
            "active_cases":    Case.objects.exclude(Q(status__istartswith='Closed') | Q(status__iexact='Archived') | Q(status__icontains='Pending') | Q(status__iexact='Consultation')).count(),
            "closed_cases":    Case.objects.filter(Q(status__istartswith='Closed') | Q(status__iexact='Archived')).count(),
            "pending_cases":   Case.objects.filter(Q(status__icontains='Pending') | Q(status__iexact='Consultation')).count(),
            "total_clients":   Client.objects.count(),
            "todays_hearings": Hearing.objects.filter(hearing_date=today).count(),
            "pending_tasks":   Task.objects.filter(is_completed=False).count() if role == 'Admin' else Task.objects.filter(is_completed=False, assigned_to=request.user).count(),
            "total_revenue":   0, # Default to 0 for unauthorized users
        }

        if has_accounts_view:
            response_data["total_revenue"] = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
            current_month_billed = Invoice.objects.filter(
                issue_date__year=today.year,
                issue_date__month=today.month
            ).aggregate(total=Sum('items__amount'))['total'] or 0

            current_month_collected = Payment.objects.filter(
                payment_date__year=today.year,
                payment_date__month=today.month
            ).aggregate(total=Sum('amount_received'))['total'] or 0

            overall_billed    = Invoice.objects.aggregate(total=Sum('items__amount'))['total'] or 0
            overall_collected = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
            overall_remaining = overall_billed - overall_collected

            monthly_billing = (
                Invoice.objects
                .annotate(month=TruncMonth('issue_date'))
                .values('month')
                .annotate(total=Sum('items__amount'))
                .order_by('-month')[:6]
            )
            billing_trend = [
                {
                    "month":  b['month'].strftime('%b %Y') if b['month'] else 'Unknown',
                    "amount": float(b['total'] or 0)
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
                    "amount": float(c['total'] or 0)
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

        period = request.query_params.get('period', 'all')
        
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        date_filter = None
        if period == 'daily':
            date_filter = now - timedelta(days=1)
        elif period == 'weekly':
            date_filter = now - timedelta(days=7)
        elif period == 'monthly':
            date_filter = now - timedelta(days=30)

        logs = []
        models_to_audit = [
            Client, Case, Hearing, Invoice, Deadline, 
            Payment, Expense, Task, ConsultationRequest, CalendarEvent, CaseTimeline
        ]
        
        for model in models_to_audit:
            qs = model.history.all().select_related('history_user').order_by('-history_date')
            if date_filter:
                qs = qs.filter(history_date__gte=date_filter)
                
            for record in qs[:100]:
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
                    case_id = getattr(record, 'case_id', None)
                    ident = f"for Case ID {case_id}" if case_id else 'Unknown Case'
                elif model.__name__ in ['Deadline', 'Task', 'CalendarEvent']:
                    ident = getattr(record, 'title', getattr(record, 'id', ''))
                elif model.__name__ == 'Payment':
                    ident = f"Rs {getattr(record, 'amount_received', '0')} for Invoice ID {getattr(record, 'invoice_id', '')}"
                elif model.__name__ == 'Expense':
                    ident = f"{getattr(record, 'category', 'Expense')} - Rs {getattr(record, 'amount', '0')}"
                elif model.__name__ == 'ConsultationRequest':
                    ident = getattr(record, 'name', getattr(record, 'id', ''))
                elif model.__name__ == 'CaseTimeline':
                    ident = f"{getattr(record, 'activity_type', 'Activity')} for Case ID {getattr(record, 'case_id', '')}"

                logs.append({
                    'id':      record.history_id,
                    'model':   model.__name__,
                    'action':  action_label,
                    'user':    user_name,
                    'date':    record.history_date,
                    'details': f"{action_label} {model.__name__} {ident}",
                })

        logs.sort(key=lambda x: x['date'], reverse=True)
        limit = 500 if date_filter else 100
        return Response(logs[:limit], status=status.HTTP_200_OK)


# ── System Ping (Keep-alive) ──────────────────────────────────────────────────

class PingView(APIView):
    """Zero-overhead endpoint to keep the Render server awake."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "active",
            "system": "Legal Office Backend Awake"
        }, status=status.HTTP_200_OK)


# ── Calendar Event ViewSet ────────────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(Q(user=user) | Q(user__isnull=True)).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user = request.user
        Notification.objects.filter(Q(user=user) | Q(user__isnull=True), is_read=False).update(is_read=True)
        return Response({"status": "success"})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({"status": "success"})
# ── Deadline ViewSet ──────────────────────────────────────────────────────────

