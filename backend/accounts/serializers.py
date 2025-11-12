from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'tenant', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    tenant_name = serializers.CharField(write_only=True, required=True, min_length=1, max_length=255)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'tenant_name']
    
    def create(self, validated_data):
        tenant_name = validated_data.pop('tenant_name')
        tenant = Tenant.objects.create(name=tenant_name)
        user = User.objects.create_user(
            tenant=tenant,
            role='admin',
            **validated_data
        )
        return user
