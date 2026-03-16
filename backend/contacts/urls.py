from django.urls import path
from .views import AdminContactListCreateView, AdminContactRetrieveUpdateDestroyView

urlpatterns = [
    path('', AdminContactListCreateView.as_view(), name='admin-contact-list-create'),
    path('<int:pk>/', AdminContactRetrieveUpdateDestroyView.as_view(), name='admin-contact-detail'),
]

