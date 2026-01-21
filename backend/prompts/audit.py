from .models import AuditLog


def create_audit_log(user, tenant, action, model_name, object_id='', changes=None, metadata=None, ip_address=None):
    """
    Create an audit log entry
    
    Args:
        user: User who performed the action
        tenant: Tenant the action belongs to
        action: Action type (CREATE, UPDATE, DELETE, TEST, etc.)
        model_name: Name of the model being acted upon
        object_id: ID of the object (optional)
        changes: Dict of changes made (optional)
        metadata: Additional metadata (optional)
        ip_address: IP address of the request (optional)
    """
    AuditLog.objects.create(
        user=user,
        tenant=tenant,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else '',
        changes=changes or {},
        metadata=metadata or {},
        ip_address=ip_address
    )


def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
