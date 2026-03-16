from django.contrib import admin
from .models import Wallet, PaymentTransaction


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance_BDT', 'updated_at']
    search_fields = ['user__username', 'user__email']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount_BDT', 'transaction_type', 'note', 'created_by', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'note']
