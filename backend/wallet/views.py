from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404

from users.permissions import IsAdminRole
from .models import Wallet, PaymentTransaction
from .serializers import (
    WalletSerializer,
    PaymentTransactionSerializer,
    CreditUserSerializer,
    PaymentTransactionUpdateSerializer,
)

User = get_user_model()


def get_or_create_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user, defaults={'balance_BDT': Decimal('0.00')})
    return wallet


class MyWalletView(APIView):
    """GET: Current user's wallet balance and recent transactions."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_wallet(request.user)
        transactions = PaymentTransaction.objects.filter(user=request.user).select_related('created_by')[:50]
        return Response({
            'wallet': WalletSerializer(wallet).data,
            'transactions': PaymentTransactionSerializer(transactions, many=True).data,
        })


class CreditUserView(APIView):
    """POST: Admin assigns money (BDT) to a user."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = CreditUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        amount_BDT = serializer.validated_data['amount_BDT']
        note = serializer.validated_data.get('note', '') or 'Admin credit'

        user = User.objects.get(pk=user_id)
        with transaction.atomic():
            wallet = get_or_create_wallet(user)
            wallet.balance_BDT += amount_BDT
            wallet.save(update_fields=['balance_BDT', 'updated_at'])
            txn = PaymentTransaction.objects.create(
                user=user,
                amount_BDT=amount_BDT,
                transaction_type=PaymentTransaction.TransactionType.CREDIT,
                note=note,
                created_by=request.user,
            )
        return Response(
            PaymentTransactionSerializer(txn).data,
            status=status.HTTP_201_CREATED,
        )


class TransactionListView(ListAPIView):
    """GET: Admin lists all payment transactions (optional ?user_id=)."""
    permission_classes = [IsAdminRole]
    serializer_class = PaymentTransactionSerializer

    def get_queryset(self):
        qs = PaymentTransaction.objects.select_related('user', 'created_by').all()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


class TransactionRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE: Admin retrieve, update, or remove a transaction. Update/delete adjust wallet balance."""
    permission_classes = [IsAdminRole]
    queryset = PaymentTransaction.objects.select_related('user', 'created_by')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return PaymentTransactionUpdateSerializer
        return PaymentTransactionSerializer

    def perform_update(self, serializer):
        txn = serializer.instance
        old_amount = txn.amount_BDT
        validated = serializer.validated_data
        new_amount = validated.get('amount_BDT')
        if new_amount is not None and new_amount < 0:
            raise ValidationError({'amount_BDT': 'Amount cannot be negative.'})
        with transaction.atomic():
            wallet = get_or_create_wallet(txn.user)
            if new_amount is not None:
                delta = new_amount - old_amount
                wallet.balance_BDT += delta
                wallet.save(update_fields=['balance_BDT', 'updated_at'])
            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            wallet = get_or_create_wallet(instance.user)
            if instance.transaction_type == PaymentTransaction.TransactionType.CREDIT:
                wallet.balance_BDT -= instance.amount_BDT
                if wallet.balance_BDT < 0:
                    wallet.balance_BDT = Decimal('0.00')
                wallet.save(update_fields=['balance_BDT', 'updated_at'])
            instance.delete()
