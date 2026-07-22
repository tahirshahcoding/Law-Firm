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


class PaymentViewSet(viewsets.ModelViewSet):
    required_module = 'accounts'
    serializer_class = PaymentSerializer
    permission_classes = [IsStaffUser, HasModulePermission]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if role == 'Admin' or role == 'Accountant' or perms.get('accounts', {}).get('view', False):
            qs = Payment.objects.select_related('invoice', 'invoice__case', 'invoice__case__client').order_by('-payment_date')
            invoice_id = self.request.query_params.get('invoice')
            if invoice_id:
                qs = qs.filter(invoice_id=invoice_id)
            return qs
        return Payment.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        profile = getattr(request.user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if role != 'Admin' and role != 'Accountant' and not perms.get('accounts', {}).get('edit', False):
                self.permission_denied(request, message="You do not have permission to modify payment records.")

class ExpenseViewSet(viewsets.ModelViewSet):
    required_module = 'accounts'
    serializer_class = ExpenseSerializer
    permission_classes = [IsStaffUser, HasModulePermission]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if role == 'Admin' or role == 'Accountant' or perms.get('accounts', {}).get('view', False):
            return Expense.objects.all().order_by('-date', '-created_at')
        return Expense.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        profile = getattr(request.user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if role != 'Admin' and role != 'Accountant' and not perms.get('accounts', {}).get('edit', False):
                self.permission_denied(request, message="You do not have permission to modify expenses.")

class InvoiceViewSet(viewsets.ModelViewSet):
    required_module = 'accounts'
    serializer_class = InvoiceSerializer
    permission_classes = [IsStaffUser, HasModulePermission]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if role == 'Admin' or role == 'Accountant' or perms.get('accounts', {}).get('view', False):
            return Invoice.objects.select_related('case', 'case__client', 'case__court').prefetch_related('items', 'payments').order_by('-created_at')
        return Invoice.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        profile = getattr(request.user, 'profile', None)
        role = getattr(profile, 'role', '')
        perms = getattr(profile, 'permissions', {})
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if role != 'Admin' and role != 'Accountant' and not perms.get('accounts', {}).get('edit', False):
                self.permission_denied(request, message="You do not have permission to modify invoices.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.paid_amount > 0:
            return Response(
                {"error": "An invoice with payments cannot be deleted. Please reverse the associated payments first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


# ── Consultation ViewSet ──────────────────────────────────────────────────────

class AccountsLedgerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = getattr(getattr(request.user, 'profile', None), 'role', '')
        perms = getattr(getattr(request.user, 'profile', None), 'permissions', {})
        if role != 'Admin' and role != 'Accountant' and not perms.get('accounts', {}).get('view', False) and not perms.get('reports', {}).get('view', False):
            return _error("Forbidden", status.HTTP_403_FORBIDDEN)

        # Recompute totals by evaluating the properties for each invoice to ensure accuracy
        invoices = Invoice.objects.select_related('case', 'case__client').all()
        total_billed = sum(inv.total_amount for inv in invoices)
        total_received = sum(inv.paid_amount for inv in invoices)
        
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
        net_profit = total_received - total_expenses
        outstanding = total_billed - total_received

        today = date.today()
        # Revenue metrics
        todays_revenue = Payment.objects.filter(payment_date=today).aggregate(total=Sum('amount_received'))['total'] or 0
        this_month_revenue = Payment.objects.filter(payment_date__year=today.year, payment_date__month=today.month).aggregate(total=Sum('amount_received'))['total'] or 0
        this_year_revenue = Payment.objects.filter(payment_date__year=today.year).aggregate(total=Sum('amount_received'))['total'] or 0

        # Top paying clients
        client_payments = (
            Payment.objects
            .values('invoice__case__client__name')
            .annotate(total=Sum('amount_received'))
            .order_by('-total')[:5]
        )
        top_paying_clients = [
            {
                "name": cp['invoice__case__client__name'] or "Unknown Client",
                "amount": float(cp['total'])
            }
            for cp in client_payments
        ]

        # Revenue by Practice Area (Case Category)
        category_payments = (
            Payment.objects
            .values('invoice__case__category')
            .annotate(total=Sum('amount_received'))
            .order_by('-total')
        )
        revenue_by_practice_area = [
            {
                "category": cp['invoice__case__category'] or "General",
                "amount": float(cp['total'])
            }
            for cp in category_payments
        ]

        monthly_payments = (
            Payment.objects
            .annotate(month=TruncMonth('payment_date'))
            .values('month')
            .annotate(total=Sum('amount_received'))
            .order_by('month')
        )

        monthly_expenses = (
            Expense.objects
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )

        raw_chart = {}
        for p in monthly_payments:
            m = p['month']
            if m:
                raw_chart[m] = {"revenue": float(p['total']), "expenses": 0.0}
        for e in monthly_expenses:
            m = e['month']
            if m:
                if m not in raw_chart:
                    raw_chart[m] = {"revenue": 0.0, "expenses": float(e['total'])}
                else:
                    raw_chart[m]["expenses"] = float(e['total'])

        # Sort chronologically by month date
        sorted_months = sorted(raw_chart.keys())
        revenue_chart_list = []
        for m in sorted_months:
            revenue_chart_list.append({
                "month": m.strftime('%b %Y'),
                "revenue": raw_chart[m]["revenue"],
                "expenses": raw_chart[m]["expenses"]
            })

        # Build chronological ledger (Cash Flow: Payments vs Expenses)
        transactions = []
        for p in Payment.objects.select_related('invoice', 'invoice__case', 'invoice__case__client').all():
            transactions.append({
                "date": p.payment_date.isoformat() if p.payment_date else p.created_at.date().isoformat(),
                "type": "Payment",
                "description": f"Payment via {p.payment_method} for {p.invoice.invoice_number}",
                "client_name": p.invoice.case.client.name,
                "case_number": p.invoice.case.case_number,
                "debit": None,
                "credit": float(p.amount_received)
            })
            
        for e in Expense.objects.select_related('case', 'case__client').all():
            transactions.append({
                "date": e.date.isoformat() if e.date else e.created_at.date().isoformat(),
                "type": "Expense",
                "description": f"{e.category} - {e.description}",
                "client_name": e.case.client.name if e.case else None,
                "case_number": e.case.case_number if e.case else None,
                "debit": float(e.amount),
                "credit": None
            })

        transactions.sort(key=lambda x: x['date'], reverse=True)

        return Response({
            "total_billed":             float(total_billed),
            "total_received":           float(total_received),
            "total_expenses":           float(total_expenses),
            "net_profit":               float(net_profit),
            "outstanding_balance":      float(outstanding),
            "todays_revenue":           float(todays_revenue),
            "this_month_revenue":       float(this_month_revenue),
            "this_year_revenue":        float(this_year_revenue),
            "top_paying_clients":       top_paying_clients,
            "revenue_by_practice_area": revenue_by_practice_area,
            "revenue_chart":            revenue_chart_list,
            "transactions":             transactions
        }, status=status.HTTP_200_OK)


# ── Daily Diary ───────────────────────────────────────────────────────────────

