from django.contrib import admin
from .models import Appointment, Service

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration_minutes', 'price', 'is_active']
    list_editable = ['is_active', 'price']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'customer_phone', 'service', 'date', 'start_time', 'status', 'added_by_owner']
    list_filter = ['status', 'date', 'service']
    search_fields = ['customer_name', 'customer_phone']
    date_hierarchy = 'date'
