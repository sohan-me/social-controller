from django.urls import path
from .views import (
    PhoneNumberListCreateView,
    PhoneNumberRetrieveUpdateDestroyView,
    PhoneNumberAssignView,
    MyPhoneNumbersView,
)

number_urlpatterns = [
    path('', PhoneNumberListCreateView.as_view(), name='number-list-create'),
    path('assign/', PhoneNumberAssignView.as_view(), name='number-assign'),
    path('my/', MyPhoneNumbersView.as_view(), name='number-my'),
    path('<int:pk>/', PhoneNumberRetrieveUpdateDestroyView.as_view(), name='number-detail'),
]
