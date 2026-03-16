from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from users.permissions import IsAdminRole
from tasks.models import PhoneNumber
from submissions.models import AccountSubmission

User = get_user_model()


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        today = timezone.now().date()

        total_users = User.objects.filter(role='user').count()
        active_users = User.objects.filter(role='user', is_active=True).count()

        total_numbers = PhoneNumber.objects.count()
        assigned_numbers = PhoneNumber.objects.filter(status='assigned').count()
        used_numbers = PhoneNumber.objects.filter(status='used').count()

        total_submissions = AccountSubmission.objects.count()
        approved_submissions = AccountSubmission.objects.filter(status='approved').count()
        rejected_submissions = AccountSubmission.objects.filter(status='rejected').count()
        pending_submissions = AccountSubmission.objects.filter(status='pending').count()

        created_today = AccountSubmission.objects.filter(created_at__date=today).count()

        approval_rate = (
            round((approved_submissions / total_submissions) * 100, 1)
            if total_submissions > 0 else 0
        )

        by_platform = list(
            AccountSubmission.objects.values('platform')
            .annotate(count=Count('id'))
            .order_by('platform')
        )

        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
            },
            'phone_numbers': {
                'total': total_numbers,
                'assigned': assigned_numbers,
                'used': used_numbers,
                'available': total_numbers - assigned_numbers - used_numbers,
            },
            'submissions': {
                'total': total_submissions,
                'approved': approved_submissions,
                'rejected': rejected_submissions,
                'pending': pending_submissions,
                'created_today': created_today,
                'approval_rate': approval_rate,
            },
            'by_platform': by_platform,
        })
