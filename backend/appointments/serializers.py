from rest_framework import serializers
from .models import Appointment, Service
from accounts.serializers import BarberSerializer


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'duration_minutes', 'price', 'is_active']


class AppointmentSerializer(serializers.ModelSerializer):
    service_detail = ServiceSerializer(source='service', read_only=True)
    barber_detail = BarberSerializer(source='barber', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'customer_name', 'customer_phone', 'customer',
            'service', 'service_detail', 'barber', 'barber_detail',
            'date', 'start_time', 'end_time', 'status', 'notes',
            'created_at', 'added_by_owner',
        ]
        read_only_fields = ['end_time', 'created_at']

    def validate(self, data):
        date = data.get('date')
        start_time = data.get('start_time')
        service = data.get('service')

        if not all([date, start_time, service]):
            return data

        from datetime import datetime, timedelta
        start_dt = datetime.combine(date, start_time)
        end_dt = start_dt + timedelta(minutes=service.duration_minutes)
        data['end_time'] = end_dt.time()

        # Check chair availability
        from django.conf import settings
        config = settings.SHOP_CONFIG
        max_chairs = config['TOTAL_CHAIRS']

        overlapping = Appointment.objects.filter(
            date=date,
            status__in=['confirmed', 'in_progress'],
            start_time__lt=end_dt.time(),
            end_time__gt=start_time,
        )
        
        # Exclude self on update
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.count() >= max_chairs:
            raise serializers.ValidationError(
                "No chairs available at this time. Please choose another slot."
            )

        return data

    def create(self, validated_data):
        return super().create(validated_data)


class WalkInBookingSerializer(serializers.ModelSerializer):
    """Simplified serializer for customers booking without an account"""
    
    class Meta:
        model = Appointment
        fields = [
            'customer_name', 'customer_phone',
            'service', 'date', 'start_time', 'notes',
        ]
    
    def validate(self, data):
        # Reuse the full serializer's validation
        full = AppointmentSerializer(data={**data, 'end_time': None})
        full.is_valid()  # triggers validate above
        return AppointmentSerializer(data=data).validate(data)
