from django.db import models
from django.conf import settings
from django.utils import timezone


class Service(models.Model):
    name = models.CharField(max_length=100)
    duration_minutes = models.IntegerField(default=30)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.duration_minutes}min - ${self.price})"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    # Customer info - either linked user or walk-in
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='appointments'
    )
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)

    # Appointment details
    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    barber = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='barber_appointments'
    )
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    notes = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    added_by_owner = models.BooleanField(default=False)

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.customer_name} - {self.date} {self.start_time} ({self.status})"
    
    @property
    def is_upcoming(self):
        now = timezone.now()
        appt_dt = timezone.make_aware(
            timezone.datetime.combine(self.date, self.start_time)
        )
        return appt_dt > now
