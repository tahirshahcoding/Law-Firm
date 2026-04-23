from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "Welcome to the Legal Office System API. The API endpoints are located at /api/."})

urlpatterns = [
    path('admin/', admin.site.urls),
    # Map the management URLs to an 'api/' prefix
    path('api/', include('management.urls')),
    # Add a root view to avoid 404
    path('', api_root, name='api-root'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)