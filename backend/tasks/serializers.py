from rest_framework import serializers
from .models import PhoneNumber
from submissions.models import AccountSubmission


class PhoneNumberSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = PhoneNumber
        fields = ['id', 'number', 'url', 'assigned_to', 'assigned_to_username', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class PhoneNumberAssignSerializer(serializers.Serializer):
    phone_number_id = serializers.IntegerField()
    user_id = serializers.IntegerField()


class SubmissionSummarySerializer(serializers.ModelSerializer):
    """Full submission details for the assigned user so they can see their own credentials (all statuses)."""
    class Meta:
        model = AccountSubmission
        fields = ['id', 'platform', 'username_or_email', 'password', 'status', 'created_at']


class SubmissionPlatformStatusSerializer(serializers.ModelSerializer):
    """Compact submission info for number list: platform and status only."""
    class Meta:
        model = AccountSubmission
        fields = ['id', 'platform', 'status']


class PhoneNumberListSerializer(serializers.ModelSerializer):
    """User-facing list: all numbers with url and approved submissions per number."""
    submissions = serializers.SerializerMethodField()

    class Meta:
        model = PhoneNumber
        fields = ['id', 'number', 'url', 'submissions']

    def get_submissions(self, obj):
        approved = obj.submissions.filter(status=AccountSubmission.Status.APPROVED)
        return SubmissionPlatformStatusSerializer(approved, many=True).data


class PhoneNumberWithSubmissionsSerializer(serializers.ModelSerializer):
    submissions = SubmissionSummarySerializer(many=True, read_only=True)

    class Meta:
        model = PhoneNumber
        fields = ['id', 'number', 'url', 'status', 'created_at', 'submissions']
