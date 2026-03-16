from django.urls import path
from .views import (
    MyWalletView,
    CreditUserView,
    TransactionListView,
    TransactionRetrieveUpdateDestroyView,
)

urlpatterns = [
    path('me/', MyWalletView.as_view(), name='wallet-me'),
    path('credit/', CreditUserView.as_view(), name='wallet-credit'),
    path('transactions/', TransactionListView.as_view(), name='wallet-transactions'),
    path('transactions/<int:pk>/', TransactionRetrieveUpdateDestroyView.as_view(), name='wallet-transaction-detail'),
]
