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
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'tenant', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'tenant', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password], style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'}, label='Confirm Password')
    tenant_name = serializers.CharField(write_only=True, required=True, min_length=1, max_length=255)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 'tenant_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        tenant_name = validated_data.pop('tenant_name')
        
        # Create tenant
        tenant = Tenant.objects.create(name=tenant_name)
        
        # Create user
        user = User.objects.create_user(
            tenant=tenant,
            role='admin',
            **validated_data
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        username = attrs.get('username', '')
        email = attrs.get('email', '')
        
        # Require at least one of username or email
        if not username and not email:
            raise serializers.ValidationError("Must provide either username or email")
        
        # Use email if provided, otherwise use username as email
        attrs['email'] = email if email else username
        
        return attrs
