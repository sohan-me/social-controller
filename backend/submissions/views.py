from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.permissions import IsAdminRole
from .models import AccountSubmission
from .serializers import AccountSubmissionSerializer, SubmissionReviewSerializer


class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = AccountSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class SubmissionListView(generics.ListAPIView):
    serializer_class = AccountSubmissionSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = AccountSubmission.objects.select_related('phone_number', 'submitted_by', 'reviewed_by').all()
        status_filter = self.request.query_params.get('status')
        platform_filter = self.request.query_params.get('platform')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if platform_filter:
            qs = qs.filter(platform=platform_filter)
        return qs


class MySubmissionsView(generics.ListAPIView):
    """Current user's submissions (for non-admin users to see their own)."""
    serializer_class = AccountSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            AccountSubmission.objects
            .filter(submitted_by=self.request.user)
            .select_related('phone_number', 'reviewed_by')
            .order_by('-created_at')
        )


class SubmissionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: full CRUD on any submission. Owner: can update only their own pending submission."""
    serializer_class = AccountSubmissionSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'DELETE'):
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'admin':
            return AccountSubmission.objects.select_related('phone_number', 'submitted_by', 'reviewed_by').all()
        # Regular users can only update their own pending submissions
        return AccountSubmission.objects.filter(
            submitted_by=user,
            status=AccountSubmission.Status.PENDING,
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class SubmissionApproveView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        submission = get_object_or_404(AccountSubmission, pk=pk)
        submission.status = AccountSubmission.Status.APPROVED
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        return Response(AccountSubmissionSerializer(submission).data)


class SubmissionRejectView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        submission = get_object_or_404(AccountSubmission, pk=pk)
        submission.status = AccountSubmission.Status.REJECTED
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        return Response(AccountSubmissionSerializer(submission).data)
