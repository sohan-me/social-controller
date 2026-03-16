from django.urls import path
from .views import (
    SubmissionCreateView,
    SubmissionListView,
    SubmissionRetrieveUpdateDestroyView,
    SubmissionApproveView,
    SubmissionRejectView,
)

urlpatterns = [
    path('', SubmissionListView.as_view(), name='submission-list'),
    path('create/', SubmissionCreateView.as_view(), name='submission-create'),
    path('<int:pk>/', SubmissionRetrieveUpdateDestroyView.as_view(), name='submission-detail'),
    path('<int:pk>/approve/', SubmissionApproveView.as_view(), name='submission-approve'),
    path('<int:pk>/reject/', SubmissionRejectView.as_view(), name='submission-reject'),
]
