from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from celery.result import AsyncResult


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        task = AsyncResult(task_id)
        
        if task.successful():
            # Task completed successfully
            return Response({
                'status': 'SUCCESS',
                'result': task.result
            })
        elif task.failed():
            # Task failed
            return Response({
                'status': 'FAILURE',
                'error': str(task.info)
            })
        else:
            # Task is still pending or running
            return Response({
                'status': 'PENDING'
            })
