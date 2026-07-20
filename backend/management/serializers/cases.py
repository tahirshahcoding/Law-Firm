from rest_framework import serializers
from management.models import Case, Hearing, HearingDocument, CaseTimeline
from .core import CourtSerializer, JudgeSerializer

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
        from management.models import Hearing
        prev_hearing = Hearing.objects.filter(
            case=obj.case,
            hearing_date__lt=obj.hearing_date
        ).order_by('-hearing_date').first()
        return prev_hearing.hearing_date if prev_hearing else None

class CaseTimelineSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = CaseTimeline
        fields = '__all__'

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return "System"
