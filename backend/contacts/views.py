from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from .models import AdminContact
from .serializers import AdminContactSerializer, AdminContactCreateUpdateSerializer
from users.permissions import IsAdminRole


class NoPagination(PageNumberPagination):
    page_size = None


class AdminContactListCreateView(generics.ListCreateAPIView):
    queryset = AdminContact.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NoPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminContactCreateUpdateSerializer
        return AdminContactSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # Admins can see all contacts (including inactive), users only see active
        if self.request.user.role == 'admin':
            return AdminContact.objects.all()
        return AdminContact.objects.filter(is_active=True)


class AdminContactRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AdminContact.objects.all()
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminContactCreateUpdateSerializer
        return AdminContactSerializer

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
