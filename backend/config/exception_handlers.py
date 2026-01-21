from rest_framework.views import exception_handler
from django_ratelimit.exceptions import Ratelimited
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Handle rate limit exceeded
    if isinstance(exc, Ratelimited):
        return Response({
            'error': 'Rate limit exceeded',
            'detail': 'You have made too many requests. Please try again later.',
            'retry_after': '60 seconds'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    return response
