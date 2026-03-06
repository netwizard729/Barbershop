from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'first_name', 'last_name', 'phone', 'role', 'is_active']
    list_editable = ['role']
    fieldsets = UserAdmin.fieldsets + (
        ('Barber Info', {'fields': ('role', 'phone')}),
    )
