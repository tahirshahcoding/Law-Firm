from django.contrib import admin
from .models import (
    UserProfile, Client, Case, Hearing,
    HearingDocument, Payment, Task, Invoice, ConsultationRequest
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('client_number', 'name', 'cnic', 'mobile_number', 'created_at')
    search_fields = ('client_number', 'name', 'cnic')
    readonly_fields = ('client_number', 'created_at')


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'client', 'court', 'status', 'total_fee', 'created_at')
    list_filter = ('status', 'district')
    search_fields = ('case_number', 'opponent_name', 'client__name')
    readonly_fields = ('created_at',)


@admin.register(Hearing)
class HearingAdmin(admin.ModelAdmin):
    list_display = ('case', 'hearing_date', 'next_date', 'hearing_stage')
    list_filter = ('hearing_stage',)
    search_fields = ('case__case_number',)


@admin.register(HearingDocument)
class HearingDocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'hearing', 'uploaded_at')
    search_fields = ('name', 'hearing__case__case_number')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('case', 'amount_received', 'payment_date')
    search_fields = ('case__case_number', 'case__client__name')
    readonly_fields = ('payment_date',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_completed', 'due_date', 'created_at')
    list_filter = ('is_completed',)
    search_fields = ('title',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'case', 'amount', 'status', 'issue_date', 'due_date')
    list_filter = ('status',)
    search_fields = ('invoice_number', 'case__case_number', 'case__client__name')
    readonly_fields = ('invoice_number', 'created_at')


@admin.register(ConsultationRequest)
class ConsultationRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'inquiry_type', 'status', 'created_at')
    list_filter = ('status', 'inquiry_type')
    search_fields = ('name', 'phone', 'email')
