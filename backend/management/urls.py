from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, CaseViewSet, HearingViewSet, HearingDocumentViewSet, TaskViewSet, InvoiceViewSet,
    AccountsLedgerView, DailyDiaryView, DashboardStatsView, AdminUserView, AdminUserDetailView, CurrentUserView,
    CustomTokenObtainPairView, TokenRefreshCookieView, LogoutView, AdvocatesView,
    ClientPortalView, ClientResetPasswordView, ClientChangePasswordView, ConsultationViewSet, AuditLogView, PaymentViewSet, ExpenseViewSet,
    PingView, CaseTimelineViewSet, ConflictCheckView, CourtViewSet, JudgeViewSet, CalendarEventViewSet, NotificationViewSet, DeadlineViewSet, BackupDatabaseView,
    MessageViewSet, ClientPortalMessagesView
)
from .views.reports import CaseReportViewSet, FinancialReportViewSet, ProductivityReportViewSet

# Router handles the standard GET/POST/PUT/DELETE for all resource ViewSets
router = DefaultRouter()
router.register(r'clients',           ClientViewSet,          basename='client')
router.register(r'cases',             CaseViewSet,            basename='case')
router.register(r'hearings',          HearingViewSet,         basename='hearing')
router.register(r'hearing-documents', HearingDocumentViewSet, basename='hearing-document')
router.register(r'tasks',             TaskViewSet,            basename='task')
router.register(r'invoices',          InvoiceViewSet,         basename='invoice')
router.register(r'payments',          PaymentViewSet,         basename='payment')
router.register(r'expenses',          ExpenseViewSet,         basename='expense')
router.register(r'consultations',     ConsultationViewSet,    basename='consultation')
router.register(r'case-timelines',    CaseTimelineViewSet,    basename='case-timeline')
router.register(r'courts',            CourtViewSet,           basename='court')
router.register(r'judges',            JudgeViewSet,           basename='judge')
router.register(r'calendar-events',   CalendarEventViewSet,   basename='calendar-event')
router.register(r'notifications',     NotificationViewSet,    basename='notification')
router.register(r'deadlines',         DeadlineViewSet,        basename='deadline')
router.register(r'messages',          MessageViewSet,         basename='message')
router.register(r'reports/cases',         CaseReportViewSet,      basename='report-cases')
router.register(r'reports/financials',    FinancialReportViewSet, basename='report-financials')
router.register(r'reports/productivity',  ProductivityReportViewSet, basename='report-productivity')

urlpatterns = [
    # ── Staff Auth (cookie-based) ──────────────────────────────────────────────
    # POST  /api/token/           — login  → sets httpOnly access_token + refresh_token cookies
    # POST  /api/token/refresh/   — refresh → rotates access_token cookie
    # POST  /api/auth/logout/     — logout  → deletes both cookies
    path('token/',         CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshCookieView.as_view(),    name='token_refresh'),
    path('auth/logout/',   LogoutView.as_view(),                name='auth_logout'),

    # ── Client Portal ──────────────────────────────────────────────────────────
    path('portal/token/',                          CustomTokenObtainPairView.as_view(), name='portal_token'),
    path('portal/data/',                           ClientPortalView.as_view(),           name='client_portal'),
    path('portal/messages/',                       ClientPortalMessagesView.as_view(),   name='client_portal_messages'),
    path('portal/reset-password/<uuid:pk>/',       ClientResetPasswordView.as_view(),    name='client_reset_password'),
    path('portal/change-password/',                ClientChangePasswordView.as_view(),   name='client_change_password'),

    # ── User Management (staff only) ───────────────────────────────────────────
    path('users/me/',    CurrentUserView.as_view(), name='users_me'),
    path('users/admin/', AdminUserView.as_view(),   name='users_admin'),
    path('users/admin/<int:pk>/', AdminUserDetailView.as_view(), name='users_admin_detail'),
    path('users/advocates/', AdvocatesView.as_view(), name='users_advocates'),

    # ── Resource Endpoints ─────────────────────────────────────────────────────
    path('cases/conflict-check/', ConflictCheckView.as_view(), name='conflict-check'),
    path('', include(router.urls)),
    path('accounts/ledger/',  AccountsLedgerView.as_view(),   name='accounts_ledger'),
    path('diary/today/',      DailyDiaryView.as_view(),        name='diary-today'),
    path('dashboard/stats/',  DashboardStatsView.as_view(),    name='dashboard-stats'),
    path('audit-log/',        AuditLogView.as_view(),          name='audit-log'),
    path('system/ping/',      PingView.as_view(),              name='keep-alive-ping'),
    path('system/backup/',    BackupDatabaseView.as_view(),    name='system-backup'),
]