from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from users.permissions import IsAdminRole
from .models import Proxy
from .serializers import (
    ProxySerializer,
    ProxyListSerializer,
    ProxyCreateSerializer,
    ProxyBulkCreateSerializer,
)
from .utils import parse_bulk_proxy_input


class NoPagination(PageNumberPagination):
    page_size = None


class ProxyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    pagination_class = NoPagination

    def get_queryset(self):
        return Proxy.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProxyListSerializer
        return ProxyCreateSerializer

    def create(self, request, *args, **kwargs):
        ser = ProxyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        proxy = Proxy.objects.create(
            host=data['host'],
            port=data['port'],
            username=data.get('username', ''),
            password=data.get('password', ''),
        )
        return Response(
            ProxySerializer(proxy).data,
            status=status.HTTP_201_CREATED,
        )


class ProxyRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    queryset = Proxy.objects.all()
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ProxyListSerializer


class ProxyBulkCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        ser = ProxyBulkCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        text = ser.validated_data['proxies']
        valid_list, errors = parse_bulk_proxy_input(text)
        created = 0
        for data in valid_list:
            Proxy.objects.create(
                host=data['host'],
                port=data['port'],
                username=data.get('username', ''),
                password=data.get('password', ''),
            )
            created += 1
        return Response({
            'created': created,
            'errors': [{'raw': r, 'message': m} for r, m in errors],
        }, status=status.HTTP_201_CREATED)
