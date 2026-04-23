from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client, Case, Hearing, HearingDocument, Task, Payment, Invoice, UserProfile
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

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'permissions']

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

class InvoiceSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    opponent_name = serializers.CharField(source='case.opponent_name', read_only=True)
    total_fee = serializers.DecimalField(source='case.total_fee', max_digits=10, decimal_places=2, read_only=True)
    client_name = serializers.CharField(source='case.client.name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class CaseSerializer(serializers.ModelSerializer):
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
    
    class Meta:
        model = Hearing
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'