from rest_framework import generics, permissions
from users.permissions import IsAdminRole
from .models import PhoneNumber
from .serializers import (
    PhoneNumberSerializer,
    PhoneNumberListSerializer,
    PhoneNumberWithSubmissionsSerializer,
)


class PhoneNumberListCreateView(generics.ListCreateAPIView):
    queryset = PhoneNumber.objects.select_related('assigned_to').all()
    serializer_class = PhoneNumberSerializer
    permission_classes = [IsAdminRole]


class PhoneNumberRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PhoneNumber.objects.all()
    serializer_class = PhoneNumberSerializer
    permission_classes = [IsAdminRole]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class PhoneNumberListView(generics.ListAPIView):
    """Returns all numbers with url and approved submissions per number (for users to pick one)."""
    serializer_class = PhoneNumberListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PhoneNumber.objects
            .prefetch_related('submissions')
            .all()
        )


class MyPhoneNumbersView(generics.ListAPIView):
    """Returns the phone numbers assigned to the current user, with their submissions nested (legacy)."""
    serializer_class = PhoneNumberWithSubmissionsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PhoneNumber.objects
            .filter(assigned_to=self.request.user)
            .prefetch_related('submissions')
        )
