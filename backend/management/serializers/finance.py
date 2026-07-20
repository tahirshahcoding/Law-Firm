from rest_framework import serializers
from management.models import Invoice, InvoiceItem, Payment, Expense

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
        
        if hasattr(self, 'initial_data') and 'items' in getattr(self, 'initial_data', {}):
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
                
        return instance

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
