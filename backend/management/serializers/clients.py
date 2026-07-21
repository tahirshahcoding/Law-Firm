from rest_framework import serializers
from management.models import Client, ConsultationRequest

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 
            'user', 
            'client_number', 
            'name', 
            'cnic', 
            'mobile_number', 
            'address', 
            'created_at'
        ]

class ConsultationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationRequest
        fields = '__all__'
