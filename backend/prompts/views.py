from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from pgvector.django import CosineDistance
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import Prompt, PromptVersion, TestRun, Benchmark, Dataset, BatchRun, GitHubIntegration, AuditLog, SystemSetting
from .serializers import PromptSerializer, PromptVersionSerializer, TestRunSerializer, BenchmarkSerializer, DatasetSerializer, BatchRunSerializer, GitHubIntegrationSerializer, AuditLogSerializer, SystemSettingSerializer
from .tasks import run_llm_test, update_prompt_embedding
from .utils import get_embedding


class PromptViewSet(viewsets.ModelViewSet):
    serializer_class = PromptSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_archived']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    
    def get_queryset(self):
        queryset = Prompt.objects.filter(tenant=self.request.user.tenant)
        
        # Handle Semantic Search
        search_query = self.request.query_params.get('search', None)
        search_type = self.request.query_params.get('type', 'keyword')
        
        if search_query and search_type == 'semantic':
            embedding = get_embedding(search_query)
            if embedding:
                # Filter by cosine distance
                # Note: CosineDistance returns 1 - cosine_similarity
                # Lower distance = higher similarity
                queryset = queryset.annotate(
                    distance=CosineDistance('embedding', embedding)
                ).order_by('distance')
                
        return queryset
    
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
    def reindex(self, request, pk=None):
        """Manually trigger embedding generation for this prompt"""
        prompt = self.get_object()
        update_prompt_embedding.delay(prompt.id)
        return Response({'status': 'indexing_started'})
    
    @action(detail=True, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='60/m', method='POST', block=True))
    def test(self, request, pk=None):
        prompt = self.get_object()
        provider = request.data.get('provider', 'openai')
        model = request.data.get('model', 'gpt-3.5-turbo')
        variables = request.data.get('variables', {})
        
        # Extract API key from headers (client-side storage)
        api_key = request.headers.get('X-API-Key')
        
        task = run_llm_test.delay(
            str(prompt.id),
            provider,
            model,
            variables,
            request.user.id,
            api_key  # Pass API key to task
        )
        
        return Response({
            'task_id': task.id,
            'status': 'pending'
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='30/m', method='POST', block=True))
    def compare(self, request, pk=None):
        """Compare prompt across multiple providers"""
        prompt = self.get_object()
        providers = request.data.get('providers', [])
        variables = request.data.get('variables', {})
        
        if not providers or len(providers) < 2:
            return Response(
                {'error': 'Please select at least 2 providers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(providers) > 8:
            return Response(
                {'error': 'Maximum 8 providers allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get API keys from headers (JSON object with provider: key mapping)
        import json
        api_keys_header = request.headers.get('X-API-Keys', '{}')
        try:
            api_keys = json.loads(api_keys_header)
        except:
            api_keys = {}
        
        # Start parallel tasks for each provider
        from .tasks import run_llm_comparison
        task = run_llm_comparison.delay(
            str(prompt.id),
            providers,
            variables,
            api_keys,
            request.user.id  
        )
        
        return Response({
            'task_id': task.id,
            'status': 'pending'
        }, status=status.HTTP_202_ACCEPTED)
    
    @action(detail=True, methods=['post'])
    def estimate(self, request, pk=None):
        """Estimate cost and tokens before running a test"""
        prompt = self.get_object()
        provider = request.data.get('provider', 'openai')
        model = request.data.get('model', 'gpt-3.5-turbo')
        max_tokens = request.data.get('max_tokens', 1000)
        variables = request.data.get('variables', {})
        
        # Get the latest version content or use current prompt content
        version = prompt.versions.first()
        prompt_text = version.content if version else prompt.content
        
        # Replace variables in prompt
        for key, value in variables.items():
            prompt_text = prompt_text.replace(f'{{{key}}}', str(value))
        
        # Calculate estimate
        from .cost_utils import estimate_cost
        estimate_data = estimate_cost(prompt_text, provider, model, max_tokens)
        
        return Response({
            'prompt_length': len(prompt_text),
            'estimated_input_tokens': estimate_data['input_tokens'],
            'estimated_output_tokens': estimate_data['output_tokens'],
            'estimated_total_tokens': estimate_data['total_tokens'],
            'estimated_input_cost': estimate_data['input_cost'],
            'estimated_output_cost': estimate_data['output_cost'],
            'estimated_total_cost': estimate_data['total_cost'],
            'pricing': estimate_data['pricing'],
            'provider': provider,
            'model': model,
            'max_tokens': max_tokens
        })

    @action(detail=True, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='20/m', method='POST', block=True))
    def run_benchmark(self, request, pk=None):
        prompt = self.get_object()
        version = prompt.versions.first()
        models_list = request.data.get('models', [])
        variables = request.data.get('variables', {})
        
        if not models_list:
            return Response({'error': 'No models provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        benchmark = Benchmark.objects.create(
            prompt=prompt,
            version=version,
            name=f"Benchmark {len(models_list)} models",
            created_by=request.user
        )
        
        for item in models_list:
            provider = item.get('provider')
            model = item.get('model')
            run_llm_test.delay(
                str(prompt.id),
                provider,
                model,
                variables,
                request.user.id,
                benchmark_id=str(benchmark.id)
            )
            
        return Response({
            'benchmark_id': benchmark.id,
            'status': 'started'
        })

    @action(detail=True, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='10/m', method='POST', block=True))
    def run_batch(self, request, pk=None):
        prompt = self.get_object()
        version = prompt.versions.first()
        dataset_id = request.data.get('dataset_id')
        variable_mapping = request.data.get('variable_mapping', {})
        provider = request.data.get('provider', 'openai')
        model = request.data.get('model', 'gpt-3.5-turbo')
        
        try:
            dataset = Dataset.objects.get(id=dataset_id, tenant=request.user.tenant)
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)
            
        batch_run = BatchRun.objects.create(
            prompt=prompt,
            version=version,
            dataset=dataset,
            created_by=request.user
        )
        
        from .tasks import execute_batch_run
        execute_batch_run.delay(
            str(batch_run.id),
            variable_mapping,
            provider,
            model
        )
        
        return Response({
            'batch_run_id': batch_run.id,
            'status': 'started'
        })

    @action(detail=True, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='30/m', method='POST', block=True))
    def push_to_github(self, request, pk=None):
        prompt = self.get_object()
        commit_message = request.data.get('commit_message', f'Update prompt {prompt.title}')
        
        from .tasks import push_to_github_task
        task = push_to_github_task.delay(
            str(prompt.id),
            commit_message,
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


class BenchmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BenchmarkSerializer
    
    def get_queryset(self):
        return Benchmark.objects.filter(prompt__tenant=self.request.user.tenant)


class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetSerializer
    
    def get_queryset(self):
        return Dataset.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class GitHubIntegrationViewSet(viewsets.ModelViewSet):
    serializer_class = GitHubIntegrationSerializer
    
    def get_queryset(self):
        return GitHubIntegration.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print(f"GitHub Integration Validation Errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view for audit logs"""
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'model_name', 'user']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return AuditLog.objects.filter(tenant=self.request.user.tenant)


class SystemSettingViewSet(viewsets.ModelViewSet):
    """System settings management"""
    serializer_class = SystemSettingSerializer
    queryset = SystemSetting.objects.all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category', 'is_public']
    ordering_fields = ['key', 'updated_at']
    ordering = ['category', 'key']
    
    def get_permissions(self):
        """
        Allow GET for public settings without auth,
        Require admin role for write operations
        """
        from rest_framework.permissions import IsAuthenticated, AllowAny
        
        if self.action in ['list', 'retrieve', 'public']:
            # Allow public settings to be read without auth
            return [AllowAny()]
        else:
            # Require authentication + admin role for write
            return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter to show only public settings for non-admin users"""
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return SystemSetting.objects.all()
        else:
            return SystemSetting.objects.filter(is_public=True)
    
    def perform_update(self, serializer):
        """Track who updated the setting and invalidate cache"""
        serializer.save(updated_by=self.request.user)
        
        # Invalidate cache
        from .settings_utils import invalidate_settings_cache
        invalidate_settings_cache()
    
    def perform_create(self, serializer):
        """Track who created the setting"""
        serializer.save(updated_by=self.request.user)
        
        # Invalidate cache
        from .settings_utils import invalidate_settings_cache
        invalidate_settings_cache()
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def public(self, request):
        """Get all public settings (no auth required)"""
        from .settings_utils import get_public_settings
        settings = get_public_settings()
        return Response(settings)


class CacheViewSet(viewsets.ViewSet):
    """Cache management endpoints"""
    
    @action(detail=False, methods=['delete'])
    def clear_my_cache(self, request):
        """Clear cache for current user's data only"""
        from django.core.cache import cache
        
        tenant_id = request.user.tenant_id
        
        # Clear tenant-specific patterns
        patterns = [
            f'promptops:*tenant:{tenant_id}:*',    # All tenant data
            f'promptops:prompt_list:{tenant_id}:*', # Prompt listings
            f'promptops:search:{tenant_id}:*',      # Search results
        ]
        
        total_deleted = 0
        for pattern in patterns:
            try:
                keys = cache.keys(pattern)
                for key in keys:
                    cache.delete(key)
                total_deleted += len(keys)
            except Exception:
                # If keys() not supported, skip
                pass
        
        return Response({
            'keys_deleted': total_deleted,
            'message': 'Your cache has been cleared',
            'scope': 'user'
        })
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all system cache (admin only)"""
        if request.user.role != 'admin':
            return Response({
                'error': 'Admin permission required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from django.core.cache import cache
        
        try:
            keys = cache.keys('*')
            count = len(keys)
        except Exception:
            count = 0
        
        cache.clear()
        
        return Response({
            'keys_deleted': count,
            'message': 'All cache cleared successfully',
            'scope': 'global'
        })
    
    @action(detail=False, methods=['get'])
    def info(self, request):
        """Get cache info for current user"""
        from django.core.cache import cache
        
        tenant_id = request.user.tenant_id
        
        # Count user's cached items
        try:
            user_keys = cache.keys(f'promptops:*tenant:{tenant_id}:*')
            my_items = len(user_keys)
            
            # Sample size calculation
            total_size = 0
            sample_size = min(100, len(user_keys))
            for key in list(user_keys)[:sample_size]:
                try:
                    value = cache.get(key)
                    if value:
                        total_size += len(str(value))
                except Exception:
                    pass
            
            # Estimate total size
            if sample_size > 0:
                estimated_size_mb = (total_size * my_items / sample_size) / (1024 * 1024)
            else:
                estimated_size_mb = 0
        except Exception:
            my_items = 0
            estimated_size_mb = 0
        
        # Get cache stats
        from .cache_utils import get_cache_stats
        stats = get_cache_stats()
        
        # Calculate hit rate
        total_requests = stats.get('hits', 0) + stats.get('misses', 0)
        hit_rate = stats.get('hits', 0) / total_requests if total_requests > 0 else 0
        
        return Response({
            'my_items': my_items,
            'my_size_mb': round(estimated_size_mb, 2),
            'hit_rate': round(hit_rate, 3),
            'cost_saved': 0.0,  # TODO: Calculate from cached LLM responses
            'total_keys': stats.get('keys_count', 0)
        })
