from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client, Case, Hearing, HearingDocument, Task, Payment, Invoice, UserProfile, ConsultationRequest, CaseTimeline, Court, Judge, CalendarEvent, Notification, Expense, InvoiceItem, Deadline
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CourtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Court
        fields = '__all__'

class JudgeSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    class Meta:
        model = Judge
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

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

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['invoice']

class InvoiceSerializer(serializers.ModelSerializer):
    case_number   = serializers.CharField(source='case.case_number', read_only=True)
    opponent_name = serializers.CharField(source='case.opponent_name', read_only=True)
    total_fee     = serializers.DecimalField(source='case.total_fee', max_digits=10, decimal_places=2, read_only=True)
    client_name   = serializers.CharField(source='case.client.name', read_only=True)
    client_number = serializers.CharField(source='case.client.client_number', read_only=True)
    client_mobile = serializers.CharField(source='case.client.mobile_number', read_only=True)
    court         = serializers.CharField(source='case.court.name', read_only=True)
    
    amount        = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2, read_only=True)
    amount_paid   = serializers.DecimalField(source='paid_amount', max_digits=10, decimal_places=2, read_only=True)
    balance_due   = serializers.DecimalField(source='balance', max_digits=10, decimal_places=2, read_only=True)
    status        = serializers.CharField(source='dynamic_status', read_only=True)
    last_payment_date = serializers.DateField(read_only=True)
    days_overdue  = serializers.IntegerField(read_only=True)
    items         = InvoiceItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = '__all__'

    def validate(self, data):
        issue_date = data.get('issue_date')
        due_date = data.get('due_date')
        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError({"due_date": "Due date cannot be before the issue date."})
        return data

    def create(self, validated_data):
        validated_data.pop('items', None)
        items_data = self.initial_data.get('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        items_data = self.initial_data.get('items', [])
        instance.issue_date = validated_data.get('issue_date', instance.issue_date)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.save()
        
        # Only update items if items array is explicitly provided
        if hasattr(self, 'initial_data') and 'items' in getattr(self, 'initial_data', {}): # type: ignore
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
                
        return instance


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class CaseSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_mobile = serializers.CharField(source='client.mobile_number', read_only=True)
    court_details = CourtSerializer(source='court', read_only=True)
    judge_details = JudgeSerializer(source='judge', read_only=True)

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
    district = serializers.CharField(source='case.court.district', read_only=True)
    tehsil = serializers.CharField(source='case.court.tehsil', read_only=True)
    court = serializers.CharField(source='case.court.name', read_only=True)
    judge = serializers.CharField(source='case.court.judge', read_only=True)
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
        if hasattr(obj, 'annotated_previous_date'):
            return obj.annotated_previous_date
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
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    case_number = serializers.CharField(source='invoice.case.case_number', read_only=True)
    client_name = serializers.CharField(source='invoice.case.client.name', read_only=True)
    case = serializers.UUIDField(source='invoice.case.id', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True, required=False)

    class Meta:
        model = Expense
        fields = '__all__'

class ConsultationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationRequest
        fields = '__all__'

class CaseTimelineSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = CaseTimeline
        fields = '__all__'

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return "System"

class CalendarEventSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    advocate_name = serializers.SerializerMethodField()
    court_name = serializers.CharField(source='case.court.name', read_only=True)
    judge_name = serializers.CharField(source='case.judge.name', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = '__all__'

    def get_advocate_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        if obj.case and obj.case.assigned_to:
            return f"{obj.case.assigned_to.first_name} {obj.case.assigned_to.last_name}".strip() or obj.case.assigned_to.username
        return None

class DeadlineSerializer(serializers.ModelSerializer):
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    client_name = serializers.CharField(source='case.client.name', read_only=True)
    assigned_user_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Deadline
        fields = '__all__'