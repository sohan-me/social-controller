from django.urls import path
from .views import (
    PhoneNumberListCreateView,
    PhoneNumberRetrieveUpdateDestroyView,
    PhoneNumberListView,
    MyPhoneNumbersView,
)

number_urlpatterns = [
    path('', PhoneNumberListCreateView.as_view(), name='number-list-create'),
    path('list/', PhoneNumberListView.as_view(), name='number-list'),
    path('my/', MyPhoneNumbersView.as_view(), name='number-my'),
    path('<int:pk>/', PhoneNumberRetrieveUpdateDestroyView.as_view(), name='number-detail'),
]
