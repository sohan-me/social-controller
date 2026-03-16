from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from users.permissions import IsAdminRole
from .models import PhoneNumber
from .serializers import (
    PhoneNumberSerializer,
    PhoneNumberAssignSerializer,
    PhoneNumberWithSubmissionsSerializer,
)

User = get_user_model()


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


class PhoneNumberAssignView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = PhoneNumberAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = get_object_or_404(PhoneNumber, pk=serializer.validated_data['phone_number_id'])
        user = get_object_or_404(User, pk=serializer.validated_data['user_id'])

        phone.assigned_to = user
        phone.status = PhoneNumber.Status.ASSIGNED
        phone.save()

        return Response(PhoneNumberSerializer(phone).data)


class MyPhoneNumbersView(generics.ListAPIView):
    """Returns the phone numbers assigned to the current user, with their submissions nested."""
    serializer_class = PhoneNumberWithSubmissionsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PhoneNumber.objects
            .filter(assigned_to=self.request.user)
            .prefetch_related('submissions')
        )
