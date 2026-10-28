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
    password2 = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'}, label='Confirm Password')
    organization_name = serializers.CharField(write_only=True, required=False, max_length=255)
    tenant_name = serializers.CharField(write_only=True, required=False, max_length=255)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'organization_name', 'tenant_name']
    
    def validate(self, attrs):
        password2 = attrs.pop('password2', None)
        if password2 is not None and password2 != attrs['password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # The frontend sends organization_name; tenant_name is kept as an alias.
        name = attrs.get('organization_name') or attrs.get('tenant_name')
        if not name:
            raise serializers.ValidationError({"organization_name": "Organization name is required."})
        attrs['organization_name'] = name
        attrs.pop('tenant_name', None)
        return attrs
    
    def create(self, validated_data):
        organization_name = validated_data.pop('organization_name')
        
        # Create tenant
        tenant = Tenant.objects.create(name=organization_name)
        
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
