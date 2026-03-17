from django.db import models
from django.conf import settings


class AccountSubmission(models.Model):
    class Platform(models.TextChoices):
        GMAIL = 'gmail', 'Gmail'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        IMO = 'imo', 'IMO'
        INSTAGRAM = 'instagram', 'Instagram'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    phone_number = models.ForeignKey(
        'tasks.PhoneNumber',
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='account_submissions',
    )
    platform = models.CharField(max_length=20, choices=Platform.choices)
    username_or_email = models.CharField(max_length=255)
    password = models.CharField(max_length=255, blank=True, default='')
    screenshot = models.ImageField(upload_to='submissions/screenshots/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_submissions',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('phone_number', 'platform')

    def __str__(self):
        return f"{self.platform} - {self.username_or_email}"
