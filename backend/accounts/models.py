from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('barber', 'Barber'),
        ('customer', 'Customer'),
    ]
    role  = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True)
    bio   = models.TextField(blank=True, help_text="Short bio shown to customers")

    def is_staff_member(self):
        return self.role in ['owner', 'barber']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
