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
        # Filter hearings by their actual hearing_date, while retaining role-based scoping on the case
        orm_filters = filters.to_orm_filters(request.user, prefix='case__', date_field='hearings__hearing_date')
        
        # We need to map case__assigned_to to case__assigned_to for scoping, but date to hearing_date
        clean_filters = {}
        for k, v in orm_filters.items():
            if 'hearings__hearing_date' in k:
                clean_filters[k.replace('case__hearings__', '')] = v
            else:
                clean_filters[k] = v
                
        qs = Hearing.objects.filter(**clean_filters)
        
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

        # Build base filters from the serializer (no prefix — we'll apply them manually)
        data = filters.validated_data
        profile = getattr(request.user, 'profile', None)
        role = getattr(profile, 'role', '')

        # ── Shared case-level filters ─────────────────────────────────
        case_filters = {}
        if data.get('status'):
            case_filters['case__status'] = data['status']
        if data.get('court_id'):
            case_filters['case__court_id'] = data['court_id']
        elif data.get('court'):
            case_filters['case__court_id'] = data['court']
        if data.get('category'):
            case_filters['case__category'] = data['category']

        # Role scoping: low-privilege users see only their own cases
        if role in ('Admin', 'Senior Partner', 'Manager'):
            staff_id = data.get('staff_id') or data.get('staff')
            if staff_id:
                case_filters['case__assigned_to'] = staff_id
        else:
            case_filters['case__assigned_to'] = request.user.id

        # ── Invoice query (date = issue_date) ─────────────────────────
        inv_filters = dict(case_filters)
        if data.get('start_date'):
            inv_filters['issue_date__gte'] = data['start_date']
        if data.get('end_date'):
            inv_filters['issue_date__lte'] = data['end_date']
        qs_invoices = Invoice.objects.filter(**inv_filters)

        # ── Payment query (date = payment_date, FK path: invoice__case__) ─
        pay_filters = {
            k.replace('case__', 'invoice__case__'): v
            for k, v in case_filters.items()
        }
        if data.get('start_date'):
            pay_filters['payment_date__gte'] = data['start_date']
        if data.get('end_date'):
            pay_filters['payment_date__lte'] = data['end_date']
        qs_payments = Payment.objects.filter(**pay_filters)

        total_billed = InvoiceItem.objects.filter(invoice__in=qs_invoices).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        total_collected = qs_payments.aggregate(s=Sum('amount_received'))['s'] or Decimal('0.00')
        total_outstanding = total_billed - total_collected

        # Revenue by Category
        category_revenue = qs_payments.values(
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
        inv_filters = filters.to_orm_filters(request.user, prefix='case__', date_field='invoices__issue_date')
        clean_inv = {k.replace('case__invoices__', ''): v for k, v in inv_filters.items()}
        
        qs = Invoice.objects.filter(**clean_inv).select_related('case__client').prefetch_related('items', 'payments')
        
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
        if start_date: case_filter &= Q(assigned_cases__created_at__date__gte=start_date)
        if end_date: case_filter &= Q(assigned_cases__created_at__date__lte=end_date)
        
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

