from rest_framework import serializers
from .models import Proxy
from .utils import parse_proxy_string


class ProxySerializer(serializers.ModelSerializer):
    class Meta:
        model = Proxy
        fields = ['id', 'host', 'port', 'username', 'password', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}


class ProxyListSerializer(serializers.ModelSerializer):
    """List view: do not expose password."""
    class Meta:
        model = Proxy
        fields = ['id', 'host', 'port', 'username', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProxyCreateSerializer(serializers.Serializer):
    """Accept either object or single string ip:port:user:pass."""
    host = serializers.CharField(required=False, allow_blank=True)
    port = serializers.IntegerField(required=False, min_value=1, max_value=65535)
    username = serializers.CharField(required=False, allow_blank=True, default='')
    password = serializers.CharField(required=False, allow_blank=True, default='')
    proxy_string = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get('proxy_string'):
            parsed = parse_proxy_string(attrs['proxy_string'])
            if not parsed:
                raise serializers.ValidationError(
                    {'proxy_string': 'Invalid format. Use ip:port:username:password'}
                )
            return parsed
        host = attrs.get('host')
        port = attrs.get('port')
        if not host:
            raise serializers.ValidationError({'host': 'Required when not using proxy_string.'})
        if port is None:
            raise serializers.ValidationError({'port': 'Required when not using proxy_string.'})
        return {
            'host': host,
            'port': port,
            'username': attrs.get('username', ''),
            'password': attrs.get('password', ''),
        }


class ProxyBulkCreateSerializer(serializers.Serializer):
    """Bulk add: single string, newline and/or comma separated."""
    proxies = serializers.CharField(allow_blank=False)
