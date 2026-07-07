from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client, Case, Hearing, HearingDocument, Task, Payment, Invoice, UserProfile, ConsultationRequest
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow login with email or username
        username_or_email = attrs.get('username')
        password = attrs.get('password')

        if username_or_email and password:
            # Check if it's an email
            if '@' in username_or_email:
                user_obj = User.objects.filter(email__iexact=username_or_email).first()
                if user_obj:
                    attrs['username'] = user_obj.username
        
        return super().validate(attrs)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'permissions', 'avatar']

    def get_role(self, obj):
        if hasattr(obj, 'client_profile'):
            return 'Client'
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return 'Staff'

    def get_permissions(self, obj):
        if hasattr(obj, 'client_profile'):
            return {} # Clients don't have staff permissions
        if hasattr(obj, 'profile'):
            return obj.profile.permissions
        return {}

    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            request = self.context.get('request')
            try:
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                # Fallback: build URL from settings
                from django.conf import settings
                media_url = getattr(settings, 'MEDIA_URL', '/media/')
                return f"{media_url}{obj.profile.avatar}"
            except Exception:
                return None
        return None

class InvoiceSerializer(serializers.ModelSerializer):
    case_number   = serializers.CharField(source='case.case_number', read_only=True)
    opponent_name = serializers.CharField(source='case.opponent_name', read_only=True)
    total_fee     = serializers.DecimalField(source='case.total_fee', max_digits=10, decimal_places=2, read_only=True)
    client_name   = serializers.CharField(source='case.client.name', read_only=True)
    client_number = serializers.CharField(source='case.client.client_number', read_only=True)
    client_mobile = serializers.CharField(source='case.client.mobile_number', read_only=True)
    court         = serializers.CharField(source='case.court', read_only=True)
    amount_paid   = serializers.SerializerMethodField()
    balance_due   = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def _get_allocations_for_case(self, case_id):
        # Cache results in the serializer instance to prevent N+1 queries during list serialization
        if not hasattr(self, '_context_allocations_cache'):
            self._context_allocations_cache = {}
            
        if case_id not in self._context_allocations_cache:
            from django.db.models import Sum
            invoices = list(Invoice.objects.filter(case_id=case_id).order_by('issue_date', 'created_at', 'id'))
            total_paid = Payment.objects.filter(case_id=case_id).aggregate(total=Sum('amount_received'))['total'] or 0
            
            allocations = {}
            for inv in invoices:
                amt = min(inv.amount, total_paid)
                total_paid -= amt
                allocations[inv.id] = amt
            self._context_allocations_cache[case_id] = allocations
            
        return self._context_allocations_cache[case_id]

    def get_amount_paid(self, obj):
        allocations = self._get_allocations_for_case(obj.case_id)
        return float(allocations.get(obj.id, 0))

    def get_balance_due(self, obj):
        allocations = self._get_allocations_for_case(obj.case_id)
        allocated = allocations.get(obj.id, 0)
        return float(max(obj.amount - allocated, 0))


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class CaseSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_mobile = serializers.CharField(source='client.mobile_number', read_only=True)

    class Meta:
        model = Case
        fields = '__all__'

class HearingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HearingDocument
        fields = '__all__'

class HearingSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    opponent_name = serializers.CharField(source='case.opponent_name', read_only=True)
    documents = HearingDocumentSerializer(many=True, read_only=True)
    district = serializers.CharField(source='case.district', read_only=True)
    tehsil = serializers.CharField(source='case.tehsil', read_only=True)
    court = serializers.CharField(source='case.court', read_only=True)
    judge = serializers.CharField(source='case.judge', read_only=True)
    client_name = serializers.CharField(source='case.client.name', read_only=True)
    client_number = serializers.CharField(source='case.client.client_number', read_only=True)
    advocate_name = serializers.SerializerMethodField()
    previous_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Hearing
        fields = '__all__'

    def get_advocate_name(self, obj):
        if obj.case.assigned_to:
            return f"{obj.case.assigned_to.first_name} {obj.case.assigned_to.last_name}".strip() or obj.case.assigned_to.username
        return "Senior Partner"

    def get_previous_date(self, obj):
        from .models import Hearing
        prev_hearing = Hearing.objects.filter(
            case=obj.case,
            hearing_date__lt=obj.hearing_date
        ).order_by('-hearing_date').first()
        return prev_hearing.hearing_date if prev_hearing else None

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    client_name = serializers.CharField(source='case.client.name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'

class ConsultationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationRequest
        fields = '__all__'