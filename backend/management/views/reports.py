from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Sum, Q
from decimal import Decimal
from django.contrib.auth.models import User
from ..models.cases import Case, Hearing
from ..models.finance import Invoice, InvoiceItem, Payment
from ..models.tasks import Deadline
from ..permissions import ReportPermission
from ..report_serializers import ReportFilterSerializer
from ..exporters import export_to_csv

class CaseReportViewSet(viewsets.ViewSet):
    """
    Reports specifically related to Cases and Hearings.
    Open to all staff, but data is scoped down based on role.
    """
    permission_classes = [IsAuthenticated, ReportPermission]
    report_category = 'cases'

    def list(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        orm_filters = filters.to_orm_filters(request.user)
        
        # Base Queryset scoped securely
        qs = Case.objects.filter(**orm_filters)
        
        # Aggregate Statuses
        status_data = qs.values('status').annotate(count=Count('id')).order_by('-count')
        
        # Aggregate Court Load
        court_data = qs.values('court__name').annotate(count=Count('id')).order_by('-count')
        
        # Top Clients by Case Volume
        client_data = qs.values('client__name').annotate(count=Count('id')).order_by('-count')[:10]

        return Response({
            'status_distribution': list(status_data),
            'court_load': list(court_data),
            'top_clients': list(client_data),
            'total_cases': qs.count()
        })
        
    @action(detail=False, methods=['get'])
    def hearings(self, request):
        """ Separate endpoint for hearing stats, still under 'cases' category """
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        # Use prefix since we are querying Hearings but filtering by Case attributes
        orm_filters = filters.to_orm_filters(request.user, prefix='case__')
        
        qs = Hearing.objects.filter(**orm_filters)
        
        hearing_stages = qs.values('hearing_stage').annotate(count=Count('id')).order_by('-count')
        
        return Response({
            'hearing_stages': list(hearing_stages),
            'total_hearings': qs.count()
        })

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        orm_filters = filters.to_orm_filters(request.user)
        
        qs = Case.objects.filter(**orm_filters)
        data = qs.values(
            'case_number', 'client__name', 'opponent_name', 
            'status', 'category', 'court__name'
        )
        return export_to_csv(list(data), 'Cases_Report')

class FinancialReportViewSet(viewsets.ViewSet):
    """
    Financial reports for Admins and Senior Partners.
    """
    permission_classes = [IsAuthenticated, ReportPermission]
    report_category = 'financial'

    def list(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        orm_filters = filters.to_orm_filters(request.user, prefix='case__')
        
        qs = Invoice.objects.filter(**orm_filters)
        
        total_billed = InvoiceItem.objects.filter(invoice__in=qs).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        total_collected = Payment.objects.filter(invoice__in=qs).aggregate(s=Sum('amount_received'))['s'] or Decimal('0.00')
        total_outstanding = total_billed - total_collected

        # Revenue by Category
        category_revenue = Payment.objects.filter(invoice__in=qs).values(
            'invoice__case__category'
        ).annotate(revenue=Sum('amount_received')).order_by('-revenue')
        
        # Rename key for the frontend
        formatted_revenue = [
            {'category': item['invoice__case__category'], 'revenue': item['revenue']}
            for item in category_revenue if item['invoice__case__category']
        ]

        return Response({
            'kpis': {
                'total_billed': total_billed,
                'total_collected': total_collected,
                'total_outstanding': total_outstanding
            },
            'revenue_by_category': formatted_revenue
        })
        
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        orm_filters = filters.to_orm_filters(request.user, prefix='case__')
        
        qs = Invoice.objects.filter(**orm_filters).select_related('case__client').prefetch_related('items', 'payments')
        
        data = []
        for inv in qs:
            data.append({
                'Invoice Number': inv.invoice_number,
                'Client': inv.case.client.name,
                'Case': inv.case.case_number,
                'Issue Date': inv.issue_date,
                'Total Amount': inv.total_amount,
                'Paid Amount': inv.paid_amount,
                'Balance': inv.balance,
                'Status': inv.dynamic_status
            })
            
        return export_to_csv(data, 'Financial_Report')


class ProductivityReportViewSet(viewsets.ViewSet):
    """
    Productivity reports for Admins and Managers.
    """
    permission_classes = [IsAuthenticated, ReportPermission]
    report_category = 'staff_productivity'

    def list(self, request):
        filters = ReportFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        
        start_date = filters.validated_data.get('start_date')
        end_date = filters.validated_data.get('end_date')
        staff_id = filters.validated_data.get('staff_id')
        
        users = User.objects.filter(profile__role__in=['Admin', 'Senior Partner', 'Manager', 'Associate', 'Staff'])
        
        profile = getattr(request.user, 'profile', None)
        role = getattr(profile, 'role', '')
        if role not in ('Admin', 'Senior Partner', 'Manager'):
            users = users.filter(id=request.user.id)
        elif staff_id:
            users = users.filter(id=staff_id)
            
        case_filter = Q()
        if start_date: case_filter &= Q(assigned_cases__created_at__gte=start_date)
        if end_date: case_filter &= Q(assigned_cases__created_at__lte=end_date)
        
        deadline_filter_comp = Q(assigned_deadlines__status='Completed')
        deadline_filter_pend = Q(assigned_deadlines__status='Pending')
        if start_date: 
            deadline_filter_comp &= Q(assigned_deadlines__due_date__gte=start_date)
            deadline_filter_pend &= Q(assigned_deadlines__due_date__gte=start_date)
        if end_date: 
            deadline_filter_comp &= Q(assigned_deadlines__due_date__lte=end_date)
            deadline_filter_pend &= Q(assigned_deadlines__due_date__lte=end_date)
            
        users = users.annotate(
            case_count=Count('assigned_cases', filter=case_filter, distinct=True),
            completed_deadlines=Count('assigned_deadlines', filter=deadline_filter_comp, distinct=True),
            pending_deadlines=Count('assigned_deadlines', filter=deadline_filter_pend, distinct=True)
        )
        
        data = users.values('id', 'first_name', 'last_name', 'profile__role', 'case_count', 'completed_deadlines', 'pending_deadlines')
        
        # Format names for frontend charts
        formatted = []
        for u in data:
            name = f"{u['first_name']} {u['last_name']}".strip() or f"User {u['id']}"
            formatted.append({
                'name': name,
                'role': u['profile__role'],
                'cases': u['case_count'],
                'completed': u['completed_deadlines'],
                'pending': u['pending_deadlines']
            })
            
        return Response(formatted)

