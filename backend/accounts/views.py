from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import (
    RegisterSerializer, UserSerializer, CustomTokenSerializer,
    BarberSerializer, BarberCreateSerializer,
)


class IsOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'


class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class   = CustomTokenSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class BarbersListView(APIView):
    """Public list of barbers — used on booking page."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        barbers = User.objects.filter(role__in=['owner', 'barber']).order_by('first_name')
        return Response(BarberSerializer(barbers, many=True).data)


class BarberManageView(APIView):
    """Owner-only: create a barber account."""
    permission_classes = [IsOwner]

    def post(self, request):
        ser = BarberCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        barber = ser.save()
        return Response(BarberSerializer(barber).data, status=status.HTTP_201_CREATED)


class BarberDetailView(APIView):
    """Owner-only: update or delete a barber account."""
    permission_classes = [IsOwner]

    def _get(self, pk):
        try:
            return User.objects.get(pk=pk, role__in=['owner', 'barber'])
        except User.DoesNotExist:
            return None

    def patch(self, request, pk):
        barber = self._get(pk)
        if not barber:
            return Response({'detail': 'Not found'}, status=404)
        ser = BarberCreateSerializer(barber, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(BarberSerializer(barber).data)

    def delete(self, request, pk):
        barber = self._get(pk)
        if not barber:
            return Response({'detail': 'Not found'}, status=404)
        if barber == request.user:
            return Response({'detail': "You can't delete yourself."}, status=400)
        barber.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
