from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, ServiceViewSet, AvailableSlotsView

router = DefaultRouter()
router.register('bookings', AppointmentViewSet, basename='appointment')
router.register('services', ServiceViewSet, basename='service')

urlpatterns = [
    path('', include(router.urls)),
    path('slots/', AvailableSlotsView.as_view(), name='available-slots'),
]
