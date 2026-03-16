from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Wallet, PaymentTransaction

User = get_user_model()


class WalletSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'user', 'username', 'balance_BDT', 'updated_at']
        read_only_fields = ['id', 'balance_BDT', 'updated_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    created_by_username = serializers.SerializerMethodField()

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'user', 'user_username', 'amount_BDT', 'transaction_type',
            'note', 'created_by', 'created_by_username', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CreditUserSerializer(serializers.Serializer):
    """Admin: assign money to a user."""
    user_id = serializers.IntegerField()
    amount_BDT = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    note = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    def validate_user_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError('User not found.')
        return value


class PaymentTransactionUpdateSerializer(serializers.ModelSerializer):
    """Admin: update amount_BDT and/or note. Partial updates allowed."""
    amount_BDT = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01, required=False)
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta:
        model = PaymentTransaction
        fields = ['amount_BDT', 'note']
