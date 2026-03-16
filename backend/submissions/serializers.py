from rest_framework import serializers
from .models import AccountSubmission


class AccountSubmissionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(required=False, allow_blank=True, default='')
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    phone_number_display = serializers.CharField(source='phone_number.number', read_only=True)

    class Meta:
        model = AccountSubmission
        fields = [
            'id', 'phone_number', 'phone_number_display', 'platform',
            'username_or_email', 'password', 'screenshot',
            'status', 'reviewed_by', 'reviewed_by_username',
            'reviewed_at', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'reviewed_by', 'reviewed_at', 'created_at']


class SubmissionReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountSubmission
        fields = ['status', 'reviewed_by', 'reviewed_at']
        read_only_fields = ['reviewed_by', 'reviewed_at']
