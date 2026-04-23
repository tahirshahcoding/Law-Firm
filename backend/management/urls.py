from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ClientViewSet, CaseViewSet, HearingViewSet, HearingDocumentViewSet, TaskViewSet, InvoiceViewSet, 
    AccountsLedgerView, DailyDiaryView, DashboardStatsView, AdminUserView, CurrentUserView,
    CustomTokenObtainPairView, ClientPortalView, ClientResetPasswordView
)

# Router handles the standard GET/POST/PUT/DELETE for Clients and Cases
router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'hearings', HearingViewSet, basename='hearing')
router.register(r'hearing-documents', HearingDocumentViewSet, basename='hearing-document')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    # Staff Auth Endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Client Portal — separate token endpoint + data endpoint
    path('portal/token/', CustomTokenObtainPairView.as_view(), name='portal_token'),
    path('portal/data/', ClientPortalView.as_view(), name='client_portal'),
    path('portal/reset-password/<uuid:pk>/', ClientResetPasswordView.as_view(), name='client_reset_password'),
    
    # User Management Endpoints (staff only)
    path('users/me/', CurrentUserView.as_view(), name='users_me'),
    path('users/admin/', AdminUserView.as_view(), name='users_admin'),

    path('', include(router.urls)),
    path('accounts/ledger/', AccountsLedgerView.as_view(), name='accounts_ledger'),
    path('diary/today/', DailyDiaryView.as_view(), name='diary-today'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]