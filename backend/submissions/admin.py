from django.contrib import admin
from .models import AccountSubmission


@admin.register(AccountSubmission)
class AccountSubmissionAdmin(admin.ModelAdmin):
    list_display = ['platform', 'username_or_email', 'status', 'reviewed_by', 'created_at']
    list_filter = ['status', 'platform']
    search_fields = ['username_or_email', 'phone_number']
