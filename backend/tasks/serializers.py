from rest_framework import serializers
from .models import PhoneNumber
from submissions.models import AccountSubmission


class PhoneNumberSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = PhoneNumber
        fields = ['id', 'number', 'assigned_to', 'assigned_to_username', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class PhoneNumberAssignSerializer(serializers.Serializer):
    phone_number_id = serializers.IntegerField()
    user_id = serializers.IntegerField()


class SubmissionSummarySerializer(serializers.ModelSerializer):
    """Full submission details for the assigned user so they can see their own credentials (all statuses)."""
    class Meta:
        model = AccountSubmission
        fields = ['id', 'platform', 'username_or_email', 'password', 'status', 'created_at']


class PhoneNumberWithSubmissionsSerializer(serializers.ModelSerializer):
    submissions = SubmissionSummarySerializer(many=True, read_only=True)

    class Meta:
        model = PhoneNumber
        fields = ['id', 'number', 'status', 'created_at', 'submissions']
