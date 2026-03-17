from django.urls import path
from .views import ProxyListCreateView, ProxyRetrieveDestroyView, ProxyBulkCreateView
from .gateway import GmailSignupProxyView

urlpatterns = [
    path('', ProxyListCreateView.as_view(), name='proxy-list-create'),
    path('bulk/', ProxyBulkCreateView.as_view(), name='proxy-bulk'),
    path('gmail-signup/', GmailSignupProxyView.as_view(), name='proxy-gmail-signup'),
    path('<int:pk>/', ProxyRetrieveDestroyView.as_view(), name='proxy-detail'),
]
