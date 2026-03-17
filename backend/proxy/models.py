from django.db import models


class Proxy(models.Model):
    """Single proxy: ip:port:username:password (stored as separate fields)."""
    host = models.CharField(max_length=255)
    port = models.PositiveIntegerField()
    username = models.CharField(max_length=255, blank=True, default='')
    password = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Proxy'
        verbose_name_plural = 'Proxies'

    def __str__(self):
        if self.username or self.password:
            return f"{self.host}:{self.port}:{self.username}:****"
        return f"{self.host}:{self.port}"

    def to_proxy_url(self):
        """Build proxy URL for requests: http://user:pass@host:port"""
        if self.username or self.password:
            from urllib.parse import quote_plus
            user = quote_plus(self.username)
            pw = quote_plus(self.password)
            return f"http://{user}:{pw}@{self.host}:{self.port}"
        return f"http://{self.host}:{self.port}"
