from django.contrib import admin
from .models import AdminContact


@admin.register(AdminContact)
class AdminContactAdmin(admin.ModelAdmin):
    list_display = ['id', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['phone', 'email']
    list_editable = ['is_active']
    ordering = ['-created_at']
