from django.db import models


class AdminContact(models.Model):
    phone = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Admin Contact'
        verbose_name_plural = 'Admin Contacts'

    def __str__(self):
        contact_info = []
        if self.phone:
            contact_info.append(f"Phone: {self.phone}")
        if self.email:
            contact_info.append(f"Email: {self.email}")
        return " | ".join(contact_info) if contact_info else f"Contact #{self.id}"
