from rest_framework import serializers
from ..models import Hearing

class PublicHearingSerializer(serializers.ModelSerializer):
    case_title = serializers.SerializerMethodField()
    court_name = serializers.CharField(source='case.court.name', read_only=True)
    judge = serializers.CharField(source='case.judge.name', read_only=True)
    date = serializers.DateField(source='hearing_date', read_only=True)
    time = serializers.TimeField(source='hearing_time', read_only=True)
    status = serializers.CharField(source='hearing_stage', read_only=True)

    class Meta:
        model = Hearing
        # never `exclude = [...]` — allowlisting is the only safe pattern here.
        # if someone adds a new sensitive field to the model later, exclude-based
        # serializers leak it by default; allowlist-based ones don't.
        fields = ['id', 'case_title', 'court_name', 'judge', 'date', 'time', 'status']

    def get_case_title(self, obj):
        # We assume the case model has client and opponent_name
        return f"{obj.case.client.name} vs {obj.case.opponent_name}"
