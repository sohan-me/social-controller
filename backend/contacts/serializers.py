from rest_framework import serializers
from .models import AdminContact


class AdminContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminContact
        fields = ['id', 'phone', 'email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminContactCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminContact
        fields = ['phone', 'email', 'is_active']

    def validate(self, attrs):
        # Only validate phone/email requirement when creating or when phone/email fields are being updated
        # Skip validation for partial updates that only change is_active
        phone_provided = 'phone' in attrs
        email_provided = 'email' in attrs
        
        # If neither phone nor email is being updated, skip validation (e.g., just updating is_active)
        if not phone_provided and not email_provided:
            return attrs
        
        # Get phone value
        if phone_provided:
            phone = attrs.get('phone', '').strip() if attrs.get('phone') else ''
        elif self.instance:
            phone = self.instance.phone.strip() if self.instance.phone else ''
        else:
            phone = ''
        
        # Get email value
        if email_provided:
            email = attrs.get('email', '').strip() if attrs.get('email') else ''
        elif self.instance:
            email = self.instance.email.strip() if self.instance.email else ''
        else:
            email = ''
        
        # Validate that at least one is provided
        if not phone and not email:
            raise serializers.ValidationError(
                'At least one of phone or email must be provided.'
            )
        
        return attrs

