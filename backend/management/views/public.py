from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import AnonRateThrottle
from django.utils import timezone
from datetime import timedelta
from ..models import Hearing
from ..serializers.public import PublicHearingSerializer

class IsFromMainWebsite(BasePermission):
    """
    Custom permission to only allow requests originating from rahimlawchamber.com.
    Checks both Origin and Referer headers to lock down the public API.
    """
    def has_permission(self, request, view):
        origin = request.META.get('HTTP_ORIGIN', '')
        referer = request.META.get('HTTP_REFERER', '')
        
        allowed_domains = [
            'https://rahimlawchamber.com', 
            'https://www.rahimlawchamber.com',
            'http://rahimlawchamber.com',
            'http://www.rahimlawchamber.com'
        ]
        
        if origin in allowed_domains:
            return True
            
        if any(referer.startswith(domain) for domain in allowed_domains):
            return True
            
        return False

class PublicHearingPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 1000

class PublicHearingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicHearingSerializer
    permission_classes = [IsFromMainWebsite]
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
