from rest_framework import serializers
from management.models import Task, CalendarEvent, Deadline

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

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
