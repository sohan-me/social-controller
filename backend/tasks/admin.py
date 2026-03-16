from django.contrib import admin
from .models import PhoneNumber


@admin.register(PhoneNumber)
class PhoneNumberAdmin(admin.ModelAdmin):
    list_display = ['number', 'assigned_to', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['number']
