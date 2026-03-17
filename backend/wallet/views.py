from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from users.permissions import IsAdminRole
from .models import Wallet, PaymentTransaction, WithdrawalRequest
from .serializers import (
    WalletSerializer,
    PaymentTransactionSerializer,
    CreditUserSerializer,
    PaymentTransactionUpdateSerializer,
    WithdrawalRequestSerializer,
    WithdrawalCreateSerializer,
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


class WithdrawView(APIView):
    """POST: User creates a withdrawal request (pending)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount_BDT = serializer.validated_data['amount_BDT']
        note = serializer.validated_data.get('note', '') or ''

        wallet = get_or_create_wallet(request.user)
        if amount_BDT > wallet.balance_BDT:
            raise ValidationError({'amount_BDT': 'Amount exceeds your balance.'})
        if amount_BDT <= 0:
            raise ValidationError({'amount_BDT': 'Amount must be greater than zero.'})

        withdrawal = WithdrawalRequest.objects.create(
            user=request.user,
            amount_BDT=amount_BDT,
            note=note,
            status=WithdrawalRequest.Status.PENDING,
        )
        return Response(
            WithdrawalRequestSerializer(withdrawal).data,
            status=status.HTTP_201_CREATED,
        )


class MyWithdrawalsView(ListAPIView):
    """GET: Current user's withdrawal requests."""
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WithdrawalRequest.objects.filter(user=self.request.user)


class WithdrawalListView(ListAPIView):
    """GET: Admin lists all withdrawal requests (optional ?status=, ?user_id=)."""
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = WithdrawalRequest.objects.select_related('user', 'reviewed_by').all()
        status_filter = self.request.query_params.get('status')
        user_id = self.request.query_params.get('user_id')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


class WithdrawalApproveView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        withdrawal = get_object_or_404(WithdrawalRequest, pk=pk)
        if withdrawal.status != WithdrawalRequest.Status.PENDING:
            raise ValidationError({'detail': 'Only pending requests can be approved.'})

        wallet = get_or_create_wallet(withdrawal.user)
        if withdrawal.amount_BDT > wallet.balance_BDT:
            raise ValidationError({'detail': 'User balance is insufficient for this withdrawal.'})

        with transaction.atomic():
            wallet.balance_BDT -= withdrawal.amount_BDT
            wallet.save(update_fields=['balance_BDT', 'updated_at'])
            PaymentTransaction.objects.create(
                user=withdrawal.user,
                amount_BDT=withdrawal.amount_BDT,
                transaction_type=PaymentTransaction.TransactionType.DEBIT,
                note='Withdrawal approved',
                created_by=request.user,
            )
            withdrawal.status = WithdrawalRequest.Status.APPROVED
            withdrawal.reviewed_by = request.user
            withdrawal.reviewed_at = timezone.now()
            withdrawal.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        return Response(WithdrawalRequestSerializer(withdrawal).data)


class WithdrawalRejectView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        withdrawal = get_object_or_404(WithdrawalRequest, pk=pk)
        if withdrawal.status != WithdrawalRequest.Status.PENDING:
            raise ValidationError({'detail': 'Only pending requests can be rejected.'})

        withdrawal.status = WithdrawalRequest.Status.REJECTED
        withdrawal.reviewed_by = request.user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        return Response(WithdrawalRequestSerializer(withdrawal).data)
