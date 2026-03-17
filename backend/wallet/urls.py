from django.urls import path
from .views import (
    MyWalletView,
    CreditUserView,
    TransactionListView,
    TransactionRetrieveUpdateDestroyView,
    WithdrawView,
    MyWithdrawalsView,
    WithdrawalListView,
    WithdrawalApproveView,
    WithdrawalRejectView,
)

urlpatterns = [
    path('me/', MyWalletView.as_view(), name='wallet-me'),
    path('credit/', CreditUserView.as_view(), name='wallet-credit'),
    path('transactions/', TransactionListView.as_view(), name='wallet-transactions'),
    path('transactions/<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='wallet-transaction-detail'),
    path('withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
    path('withdrawals/me/', MyWithdrawalsView.as_view(), name='wallet-withdrawals-me'),
    path('withdrawals/', WithdrawalListView.as_view(), name='wallet-withdrawals-list'),
    path('withdrawals/<int:pk>/approve/', WithdrawalApproveView.as_view(), name='wallet-withdrawal-approve'),
    path('withdrawals/<int:pk>/reject/', WithdrawalRejectView.as_view(), name='wallet-withdrawal-reject'),
]
