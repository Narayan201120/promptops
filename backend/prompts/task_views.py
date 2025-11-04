from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from celery.result import AsyncResult


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        task = AsyncResult(task_id)
        
        if task.ready():
            result = task.result
            return Response({
                'status': 'completed',
                'result': result
            })
        elif task.failed():
            return Response({
                'status': 'failed',
                'error': str(task.info)
            })
        else:
            return Response({
                'status': 'pending'
            })
