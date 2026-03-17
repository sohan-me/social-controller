from django.contrib import admin
from .models import Proxy


@admin.register(Proxy)
class ProxyAdmin(admin.ModelAdmin):
    list_display = ['id', 'host', 'port', 'username', 'created_at']
    list_filter = ['created_at']
    search_fields = ['host', 'username']
