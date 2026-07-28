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
    max_page_size = 1000

class PublicHearingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicHearingSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'head', 'options']  # belt-and-suspenders w/ ReadOnlyModelViewSet
    pagination_class = PublicHearingPagination
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'public_hearings'
    lookup_field = 'id'

    def get_queryset(self):
        from django.db.models import Q
        today = timezone.now().date()
        
        qs = Hearing.objects.filter(
            hearing_date=today
        ).select_related('case', 'case__client', 'case__court', 'case__judge').order_by('hearing_time')

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(case__client__name__icontains=search) |
                Q(case__opponent_name__icontains=search) |
                Q(case__case_number__icontains=search) |
                Q(case__court__name__icontains=search) |
                Q(case__judge__name__icontains=search)
            ).distinct()
            
        return qs
