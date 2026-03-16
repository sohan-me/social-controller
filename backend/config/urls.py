from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.urls import auth_urlpatterns, user_urlpatterns
from tasks.urls import number_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include(auth_urlpatterns)),
    path('api/users/', include(user_urlpatterns)),
    path('api/numbers/', include(number_urlpatterns)),
    path('api/submissions/', include('submissions.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/contacts/', include('contacts.urls')),
    path('api/wallet/', include('wallet.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
