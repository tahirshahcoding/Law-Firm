from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import AnonRateThrottle
from django.utils import timezone
from datetime import timedelta
from ..models import Hearing
from ..serializers.public import PublicHearingSerializer

class PublicHearingPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 100

class PublicHearingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicHearingSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'head', 'options']  # belt-and-suspenders w/ ReadOnlyModelViewSet
    pagination_class = PublicHearingPagination
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'public_hearings'
    lookup_field = 'id'

    def get_queryset(self):
        today = timezone.now().date()
        window_start = today - timedelta(days=30)
        window_end = today + timedelta(days=30)
        
        qs = Hearing.objects.filter(
            hearing_date__range=[window_start, window_end]
        ).select_related('case', 'case__client', 'case__court', 'case__judge').order_by('hearing_date', 'hearing_time')
        
        # Support optional filtering (e.g., today, tomorrow, etc) mapped to fixed dates
        filter_param = self.request.query_params.get('timeframe')
        if filter_param == 'today':
            qs = qs.filter(hearing_date=today)
        elif filter_param == 'tomorrow':
            qs = qs.filter(hearing_date=today + timedelta(days=1))
        elif filter_param == 'yesterday':
            qs = qs.filter(hearing_date=today - timedelta(days=1))
        elif filter_param == 'last_7':
            qs = qs.filter(hearing_date__range=[today - timedelta(days=7), today - timedelta(days=1)])
        elif filter_param == 'next_7':
            qs = qs.filter(hearing_date__range=[today + timedelta(days=1), today + timedelta(days=7)])
        elif filter_param == 'upcoming':
            qs = qs.filter(hearing_date__gte=today)
        elif filter_param == 'past':
            qs = qs.filter(hearing_date__lt=today).order_by('-hearing_date', '-hearing_time')
            
        return qs
