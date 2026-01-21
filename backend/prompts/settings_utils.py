from django.core.cache import cache
from .models import SystemSetting


def get_setting(key, default=None):
    """
    Get a system setting value with caching
    
    Args:
        key: Setting key
        default: Default value if setting doesn't exist
        
    Returns:
        Setting value or default
    """
    cache_key = f'system_setting:{key}'
    value = cache.get(cache_key)
    
    if value is None:
        try:
            setting = SystemSetting.objects.get(key=key)
            value = setting.value
            # Cache for 5 minutes
            cache.set(cache_key, value, timeout=300)
        except SystemSetting.DoesNotExist:
            return default
    
    return value


def set_setting(key, value, description='', is_public=False, category='general', user=None):
    """
    Set a system setting value
    
    Args:
        key: Setting key
        value: Setting value (will be stored as JSON)
        description: Setting description
        is_public: Whether setting is publicly accessible
        category: Setting category
        user: User making the change
    """
    setting, created = SystemSetting.objects.update_or_create(
        key=key,
        defaults={
            'value': value,
            'description': description,
            'is_public': is_public,
            'category': category,
            'updated_by': user
        }
    )
    
    # Invalidate cache
    cache_key = f'system_setting:{key}'
    cache.delete(cache_key)
    
    return setting


def get_public_settings():
    """Get all public settings (for frontend)"""
    cache_key = 'system_settings:public'
    settings = cache.get(cache_key)
    
    if settings is None:
        settings = {
            s.key: s.value 
            for s in SystemSetting.objects.filter(is_public=True)
        }
        cache.set(cache_key, settings, timeout=300)
    
    return settings


def invalidate_settings_cache():
    """Invalidate all settings cache"""
    # This is a simple approach - in production you might use cache patterns
    cache.delete('system_settings:public')
