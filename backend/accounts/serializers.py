from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'bio']
        read_only_fields = ['role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = 'customer'
        user.save()
        return user


class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class BarberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'bio', 'phone', 'role']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class BarberCreateSerializer(serializers.ModelSerializer):
    """Owner uses this to create / update barber accounts."""
    password = serializers.CharField(write_only=True, min_length=6, required=False)

    class Meta:
        model  = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone', 'bio', 'password', 'role']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', 'BarberPass1!')
        user = User(**validated_data)
        user.set_password(password)
        if user.role not in ('owner', 'barber'):
            user.role = 'barber'
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
