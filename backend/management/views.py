import secrets
import string
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import date
from django.db.models import Sum
from django.contrib.auth.models import User
from .models import Client, Case, Hearing, HearingDocument, Task, Payment, Invoice, UserProfile
from .serializers import (
    ClientSerializer, CaseSerializer, HearingSerializer, HearingDocumentSerializer,
    TaskSerializer, InvoiceSerializer, UserSerializer, CustomTokenObtainPairSerializer
)

class AdminUserView(APIView):
    # Only Admin users can manage other users
    permission_classes = [IsAuthenticated] # We will check role manually in the method for flexibility

    def get(self, request):
        if getattr(request.user.profile, 'role', '') != 'Admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().select_related('profile')
        serializer = UserSerializer(users, many=True)
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
            # Create profile
            UserProfile.objects.create(
                user=user,
                role=data.get('role', 'Staff'),
                permissions=data.get('permissions', {})
            )
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
        
    def put(self, request):
        user = request.user
        data = request.data
        
        # Update username if provided
        if 'username' in data and data['username'].strip():
            # Check if username is already taken
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username'].strip()
            
        # Update email if provided
        if 'email' in data:
            user.email = data['email'].strip()
            
        # Update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
            
        user.save()
        return Response(UserSerializer(user).data)

class ClientPortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'client_profile') or not user.client_profile:
            return Response({"error": "Only clients can access this portal."}, status=status.HTTP_403_FORBIDDEN)
        
        client = user.client_profile
        cases = Case.objects.filter(client=client).order_by('-created_at')
        hearings = Hearing.objects.filter(case__client=client).order_by('hearing_date')

        # Serialize
        cases_data = CaseSerializer(cases, many=True).data
        hearings_data = HearingSerializer(hearings, many=True).data

        return Response({
            "client": ClientSerializer(client).data,
            "cases": cases_data,
            "hearings": hearings_data
        })

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-created_at')
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _generate_password(length=12):
        """Generate a cryptographically secure alphanumeric password."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '')
        cnic = request.data.get('cnic', '')

        if Case.objects.filter(opponent_name__iexact=name).exists():
            return Response(
                {"error": "Conflict Detected: This individual is registered as an opponent in an existing case."},
                status=status.HTTP_409_CONFLICT
            )
        if Client.objects.filter(cnic=cnic).exists():
            return Response(
                {"error": "Conflict Detected: A client with this CNIC is already registered."},
                status=status.HTTP_409_CONFLICT
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()

        # Auto-generate secure portal credentials
        raw_password = self._generate_password()
        username = client.client_number  # e.g. C-001

        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                password=raw_password,
                first_name=client.name
            )
            client.user = user
            client.save()
        else:
            raw_password = None  # username collision fallback

        headers = self.get_success_headers(serializer.data)
        response_data = dict(serializer.data)
        response_data['portal_username'] = username
        response_data['portal_password'] = raw_password  # shown once, never stored in plain text
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

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all().order_by('-created_at')
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

class HearingViewSet(viewsets.ModelViewSet):
    queryset = Hearing.objects.all().order_by('hearing_date')
    serializer_class = HearingSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.parsers import MultiPartParser, FormParser

class HearingDocumentViewSet(viewsets.ModelViewSet):
    queryset = HearingDocument.objects.all().order_by('-uploaded_at')
    serializer_class = HearingDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('is_completed', '-created_at')
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.permissions import AllowAny
from .models import ConsultationRequest
from .serializers import ConsultationRequestSerializer

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = ConsultationRequest.objects.all().order_by('-created_at')
    serializer_class = ConsultationRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

class AccountsLedgerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_billed = Case.objects.aggregate(total=Sum('total_fee'))['total'] or 0
        total_received = Payment.objects.aggregate(total=Sum('amount_received'))['total'] or 0
        outstanding_balance = total_billed - total_received

        from django.db.models.functions import TruncMonth
        monthly_payments = (
            Payment.objects
            .annotate(month=TruncMonth('payment_date'))
            .values('month')
            .annotate(total=Sum('amount_received'))
            .order_by('month')
        )
        
        revenue_chart = []
        for p in monthly_payments:
            revenue_chart.append({
                "month": p['month'].strftime('%b %Y') if p['month'] else 'Unknown',
                "revenue": p['total']
            })

        return Response({
            "total_billed": total_billed,
            "total_received": total_received,
            "outstanding_balance": outstanding_balance,
            "revenue_chart": revenue_chart
        }, status=status.HTTP_200_OK)

class DailyDiaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        hearings = Hearing.objects.filter(hearing_date=today)
        serializer = HearingSerializer(hearings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        active_cases = Case.objects.filter(status__iexact='active').count()
        total_clients = Client.objects.count()
        todays_hearings = Hearing.objects.filter(hearing_date=today).count()
        total_revenue = Case.objects.aggregate(total=Sum('total_fee'))['total'] or 0
        
        return Response({
            "active_cases": active_cases,
            "total_clients": total_clients,
            "todays_hearings": todays_hearings,
            "total_revenue": total_revenue
        }, status=status.HTTP_200_OK)