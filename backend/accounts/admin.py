from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Tenant, User


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'tenant', 'role']
    list_filter = ['role', 'tenant']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('tenant', 'role')}),
    )
