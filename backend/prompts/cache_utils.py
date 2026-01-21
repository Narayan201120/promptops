"""Caching utilities for improved performance"""
import hashlib
import json
from functools import wraps
from django.core.cache import cache


def generate_cache_key(prefix, *args, **kwargs):
    """
    Generate deterministic cache key from arguments
    
    Args:
        prefix: Cache key prefix
        *args: Position arguments to include in key
        **kwargs: Keyword arguments to include in key
        
    Returns:
        str: Cache key
    """
    # Combine all inputs
    parts = [prefix]
    
    # Add positional args
    for arg in args:
        if isinstance(arg, (dict, list)):
            parts.append(json.dumps(arg, sort_keys=True))
        else:
            parts.append(str(arg))
    
    # Add keyword args (sorted for consistency)
    for key in sorted(kwargs.keys()):
        value = kwargs[key]
        if isinstance(value, (dict, list)):
            parts.append(f"{key}:{json.dumps(value, sort_keys=True)}")
        else:
            parts.append(f"{key}:{value}")
    
    # Create hash for long keys
    content = ':'.join(parts)
    if len(content) > 200:
        hash_obj = hashlib.sha256(content.encode())
        return f"{prefix}:{hash_obj.hexdigest()[:16]}"
    
    return content


def cache_response(key_prefix, ttl=300):
    """
    Decorator to cache function responses
    
    Args:
        key_prefix: Cache key prefix
        ttl: Time to live in seconds
        
    Usage:
        @cache_response('my_func', ttl=600)
        def my_expensive_function(arg1, arg2):
            # ... expensive operation
            return result
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = generate_cache_key(key_prefix, *args, **kwargs)
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern):
    """
    Delete all cache keys matching pattern
    
    Args:
        pattern: Redis pattern (e.g., 'llm_response:*', 'tenant:123:*')
        
    Returns:
        int: Number of keys deleted
    """
    try:
        keys = cache.keys(pattern)
        count = 0
        for key in keys:
            cache.delete(key)
            count += 1
        return count
    except Exception:
        # Fallback if keys() not supported
        cache.clear()
        return 0


def get_cache_stats():
    """
    Get cache statistics
    
    Returns:
        dict: Cache statistics
    """
    try:
        # Try to get stats from django-redis
        from django_redis import get_redis_connection
        
        conn = get_redis_connection('default')
        info = conn.info('stats')
        
        return {
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0),
            'keys_count': conn.dbsize(),
        }
    except Exception:
        return {
            'hits': 0,
            'misses': 0,
            'keys_count': 0,
        }
