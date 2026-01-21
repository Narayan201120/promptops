"""Health check endpoints for monitoring system status"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.views.decorators.http import require_http_methods
from celery import current_app
from datetime import datetime
import time


@require_http_methods(["GET"])
def basic_health(request):
    """
    Basic health check for load balancers and uptime monitors
    
    Returns 200 if system is healthy, 503 if unhealthy
    """
    try:
        # Quick database check
        connection.ensure_connection()
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'error': str(e)
        }, status=503)


@require_http_methods(["GET"])
def detailed_health(request):
    """
    Detailed health check for monitoring all system components
    
    Checks: Database, Redis, Celery workers
    Requires admin authentication for security
    """
    # Check if user is authenticated and is admin
    if not request.user.is_authenticated or request.user.role != 'admin':
        return JsonResponse({
            'error': 'Admin authentication required'
        }, status=403)
    
    components = {}
    overall_healthy = True
    
    # Database check
    db_status = check_database()
    components['database'] = db_status
    if db_status['status'] != 'healthy':
        overall_healthy = False
    
    # Redis check
    redis_status = check_redis()
    components['redis'] = redis_status
    if redis_status['status'] != 'healthy':
        overall_healthy = False
    
    # Celery check
    celery_status = check_celery()
    components['celery'] = celery_status
    if celery_status['status'] != 'healthy':
        overall_healthy = False
    
    response_data = {
        'status': 'healthy' if overall_healthy else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': '1.0.0',
        'components': components
    }
    
    status_code = 200 if overall_healthy else 503
    return JsonResponse(response_data, status=status_code)


def check_database():
    """Check PostgreSQL database connectivity and latency"""
    try:
        start = time.time()
        connection.ensure_connection()
        
        # Execute a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        latency = int((time.time() - start) * 1000)
        
        # Get PostgreSQL version
        db_version = f"PostgreSQL {connection.pg_version}"
        
        return {
            'status': 'healthy',
            'latency_ms': latency,
            'details': db_version
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


def check_redis():
    """Check Redis connectivity and latency"""
    try:
        start = time.time()
        
        # Try to set and get a value
        test_key = 'health_check_test'
        test_value = 'ok'
        cache.set(test_key, test_value, timeout=10)
        value = cache.get(test_key)
        
        if value != test_value:
            raise Exception('Redis read/write test failed')
        
        # Clean up
        cache.delete(test_key)
        
        latency = int((time.time() - start) * 1000)
        
        return {
            'status': 'healthy',
            'latency_ms': latency,
            'details': 'Connected and responsive'
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


def check_celery():
    """Check Celery workers status"""
    try:
        # Get active workers with a short timeout
        inspect = current_app.control.inspect(timeout=2.0)
        active = inspect.active()
        stats = inspect.stats()
        
        if not active and not stats:
            return {
                'status': 'unhealthy',
                'active_workers': 0,
                'error': 'No workers available'
            }
        
        worker_count = len(stats.keys()) if stats else 0
        
        # Count active tasks
        active_tasks = sum(len(tasks) for tasks in active.values()) if active else 0
        
        return {
            'status': 'healthy',
            'active_workers': worker_count,
            'active_tasks': active_tasks
        }
    except Exception as e:
        return {
            'status': 'degraded',  # Celery not being available isn't critical
            'active_workers': 0,
            'error': str(e)
        }
