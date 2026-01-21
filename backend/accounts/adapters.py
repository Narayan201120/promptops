from allauth.account.adapter import DefaultAccountAdapter


class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom account adapter for additional logic"""
    
    def save_user(self, request, user, form, commit=True):
        """
        Save a new user with tenant assignment
        """
        user = super().save_user(request, user, form, commit=False)
        
        # Get tenant_name from request data (comes from RegisterSerializer)
        tenant_name = request.data.get('tenant_name', None)
        
        if not tenant_name:
            # Fallback to email-based tenant name
            tenant_name = user.email.split('@')[0] + "'s Workspace"
        
        # Assign tenant if not already assigned
        if not hasattr(user, 'tenant') or user.tenant is None:
            from accounts.models import Tenant
            tenant, created = Tenant.objects.get_or_create(
                name=tenant_name,
                defaults={'created_by': user}
            )
            user.tenant = tenant
            user.role = 'admin'  # First user in tenant is admin
        
        if commit:
            user.save()
        return user
