from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta, date as date_type
from .models import Appointment, Service
from .serializers import AppointmentSerializer, ServiceSerializer


class IsOwnerOrBarber(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff_member()


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        # Staff see all services including inactive; public see only active
        if self.request.user.is_authenticated and hasattr(self.request.user, 'is_staff_member') and self.request.user.is_staff_member():
            return Service.objects.all().order_by('name')
        return Service.objects.filter(is_active=True).order_by('name')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsOwnerOrBarber()]


class AvailableSlotsView(APIView):
    """
    Returns available time slots for a given date.
    Query params: date (YYYY-MM-DD), service_id
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')

        if not date_str:
            return Response({'error': 'date parameter required'}, status=400)

        try:
            query_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

        config = settings.SHOP_CONFIG
        
        # Check if shop is open that day
        weekday = query_date.weekday()
        if weekday not in config['WORKING_DAYS']:
            return Response({'slots': [], 'message': 'Shop is closed on this day'})

        # Generate all possible slots
        open_time = datetime.strptime(config['OPEN_TIME'], '%H:%M')
        close_time = datetime.strptime(config['CLOSE_TIME'], '%H:%M')
        slot_duration = config['SLOT_DURATION']
        
        # If service_id provided, use that duration
        service_duration = slot_duration
        if service_id:
            try:
                service = Service.objects.get(pk=service_id)
                service_duration = service.duration_minutes
            except Service.DoesNotExist:
                pass

        total_chairs = config['TOTAL_CHAIRS']
        slots = []
        current = open_time

        while current + timedelta(minutes=service_duration) <= close_time:
            slot_start = current.time()
            slot_end = (current + timedelta(minutes=service_duration)).time()

            # Count overlapping confirmed appointments
            overlapping_count = Appointment.objects.filter(
                date=query_date,
                status__in=['confirmed', 'in_progress'],
                start_time__lt=slot_end,
                end_time__gt=slot_start,
            ).count()

            available_chairs = total_chairs - overlapping_count
            
            # Skip past slots for today
            now = datetime.now()
            slot_dt = datetime.combine(query_date, slot_start)
            is_past = query_date == date_type.today() and slot_dt < now + timedelta(minutes=15)

            slots.append({
                'time': slot_start.strftime('%H:%M'),
                'time_display': datetime.combine(query_date, slot_start).strftime('%I:%M %p'),
                'available_chairs': max(0, available_chairs),
                'is_available': available_chairs > 0 and not is_past,
                'is_past': is_past,
            })

            current += timedelta(minutes=slot_duration)

        return Response({
            'date': date_str,
            'slots': slots,
            'total_chairs': total_chairs,
            'shop_open': config['OPEN_TIME'],
            'shop_close': config['CLOSE_TIME'],
        })


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()
        if user.is_staff_member():
            # Staff always sees ALL appointments (including walk-ins with no account)
            # Date/status filtering is only applied on list actions, not detail actions
            qs = Appointment.objects.select_related('service', 'barber', 'customer')
            if self.action == 'list':
                date_str = self.request.query_params.get('date')
                if date_str:
                    qs = qs.filter(date=date_str)
                status_filter = self.request.query_params.get('status')
                if status_filter:
                    qs = qs.filter(status=status_filter)
            return qs
        # Customers see their own bookings (by account OR by phone if walk-in)
        return Appointment.objects.filter(customer=user).select_related('service', 'barber')

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update_status', 'destroy']:
            return [IsOwnerOrBarber()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # If authenticated customer, attach their info
        if request.user.is_authenticated and not request.user.is_staff_member():
            data['customer'] = request.user.pk
            if not data.get('customer_name'):
                data['customer_name'] = request.user.get_full_name() or request.user.username
            if not data.get('customer_phone'):
                data['customer_phone'] = request.user.phone

        # Mark if added by owner
        if request.user.is_authenticated and request.user.is_staff_member():
            data['added_by_owner'] = True

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsOwnerOrBarber])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')
        valid = [s[0] for s in Appointment.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'error': f'Invalid status. Choose from: {valid}'}, status=400)
        appointment.status = new_status
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=False, methods=['get'], permission_classes=[IsOwnerOrBarber])
    def today(self, request):
        today = date_type.today()
        appointments = Appointment.objects.filter(
            date=today
        ).exclude(status='cancelled').select_related('service', 'barber', 'customer').order_by('start_time')
        return Response(AppointmentSerializer(appointments, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[IsOwnerOrBarber])
    def dashboard_stats(self, request):
        today = date_type.today()
        week_start = today - timedelta(days=today.weekday())
        
        return Response({
            'today_total': Appointment.objects.filter(date=today).exclude(status='cancelled').count(),
            'today_completed': Appointment.objects.filter(date=today, status='completed').count(),
            'today_pending': Appointment.objects.filter(date=today, status__in=['confirmed', 'in_progress']).count(),
            'week_total': Appointment.objects.filter(date__gte=week_start, date__lte=today).exclude(status='cancelled').count(),
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def cancel_by_customer(self, request):
        """Allow customers to cancel using their phone number"""
        pass

    def perform_destroy(self, instance):
        instance.status = 'cancelled'
        instance.save()
