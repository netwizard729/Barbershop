from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from appointments.models import Service

User = get_user_model()

DEFAULT_SERVICES = [
    {"name": "Haircut",              "duration_minutes": 30,  "price": "25.00"},
    {"name": "Beard Trim",           "duration_minutes": 20,  "price": "15.00"},
    {"name": "Haircut + Beard Trim", "duration_minutes": 45,  "price": "35.00"},
    {"name": "Kids Cut (Under 12)",  "duration_minutes": 20,  "price": "15.00"},
    {"name": "Shape Up / Edge Up",   "duration_minutes": 20,  "price": "15.00"},
    {"name": "Hot Towel Shave",      "duration_minutes": 30,  "price": "20.00"},
    {"name": "Full Service",         "duration_minutes": 60,  "price": "50.00"},
]

ADMIN_CREDENTIALS = {
    "username":   "admin",
    "email":      "admin@barberbook.com",
    "password":   "Admin1234!",
    "first_name": "Shop",
    "last_name":  "Owner",
    "role":       "owner",
}


class Command(BaseCommand):
    help = "Seed the database with default services and admin account"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-seed even if data already exists",
        )

    def handle(self, *args, **options):
        force = options["force"]

        # ── Admin account ─────────────────────────────────────────────────
        if User.objects.filter(username=ADMIN_CREDENTIALS["username"]).exists():
            if force:
                User.objects.filter(username=ADMIN_CREDENTIALS["username"]).delete()
                self.stdout.write("  Deleted existing admin user (--force).")
            else:
                self.stdout.write(
                    self.style.WARNING("  Admin user already exists – skipping.")
                )

        if not User.objects.filter(username=ADMIN_CREDENTIALS["username"]).exists():
            user = User.objects.create_superuser(
                username=ADMIN_CREDENTIALS["username"],
                email=ADMIN_CREDENTIALS["email"],
                password=ADMIN_CREDENTIALS["password"],
            )
            user.first_name = ADMIN_CREDENTIALS["first_name"]
            user.last_name  = ADMIN_CREDENTIALS["last_name"]
            user.role       = ADMIN_CREDENTIALS["role"]
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"  ✔ Admin account created  →  username: admin  /  password: Admin1234!"
                )
            )

        # ── Services ──────────────────────────────────────────────────────
        created_count = 0
        for svc in DEFAULT_SERVICES:
            obj, created = Service.objects.get_or_create(
                name=svc["name"],
                defaults={
                    "duration_minutes": svc["duration_minutes"],
                    "price":            svc["price"],
                    "is_active":        True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✔ Service added: {obj.name}")
                )
            elif force:
                obj.duration_minutes = svc["duration_minutes"]
                obj.price            = svc["price"]
                obj.is_active        = True
                obj.save()
                self.stdout.write(f"  ↻ Service updated: {obj.name}")

        if created_count == 0 and not force:
            self.stdout.write(
                self.style.WARNING("  Services already exist – skipping.")
            )

        self.stdout.write(self.style.SUCCESS("\n✅  Seed complete."))
