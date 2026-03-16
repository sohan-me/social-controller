from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        USER = 'user', 'User'

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    full_name = models.CharField(max_length=150, blank=True, default='')
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    phone_number = models.CharField(max_length=30, blank=True, default='')
    address = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
