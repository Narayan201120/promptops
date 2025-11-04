from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Prompt, PromptVersion, TestRun
from .serializers import PromptSerializer, PromptVersionSerializer, TestRunSerializer
from .tasks import run_llm_test


class PromptViewSet(viewsets.ModelViewSet):
    serializer_class = PromptSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_archived']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    
    def get_queryset(self):
        return Prompt.objects.filter(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        prompt = self.get_object()
        versions = prompt.versions.all()
        serializer = PromptVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def revert(self, request, pk=None):
        prompt = self.get_object()
        version_id = request.data.get('version_id')
        version = PromptVersion.objects.get(id=version_id, prompt=prompt)
        prompt.content = version.content
        prompt.save()
        return Response(PromptSerializer(prompt).data)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        prompt = self.get_object()
        provider = request.data.get('provider', 'openai')
        model = request.data.get('model', 'gpt-3.5-turbo')
        variables = request.data.get('variables', {})
        
        task = run_llm_test.delay(
            str(prompt.id),
            provider,
            model,
            variables,
            request.user.id
        )
        
        return Response({
            'task_id': task.id,
            'status': 'pending'
        }, status=status.HTTP_202_ACCEPTED)


class TestRunViewSet(viewsets.ModelViewSet):
    serializer_class = TestRunSerializer
    
    def get_queryset(self):
        return TestRun.objects.filter(prompt__tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
