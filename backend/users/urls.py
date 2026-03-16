from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, UserListCreateView, UserRetrieveUpdateDestroyView, MeView

auth_urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
]

user_urlpatterns = [
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('me/', MeView.as_view(), name='user-me'),
    path('<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
]
