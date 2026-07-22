from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.public import PublicHearingViewSet

router = DefaultRouter()
router.register(r'hearings', PublicHearingViewSet, basename='public-hearing')

urlpatterns = [
    path('', include(router.urls)),
]
