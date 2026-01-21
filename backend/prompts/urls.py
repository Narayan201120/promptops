from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptViewSet, TestRunViewSet, BenchmarkViewSet, DatasetViewSet, GitHubIntegrationViewSet, AuditLogViewSet, SystemSettingViewSet, CacheViewSet
from .task_views import TaskStatusView

router = DefaultRouter()
router.register('prompts', PromptViewSet, basename='prompt')
router.register('test-runs', TestRunViewSet, basename='testrun')
router.register('benchmarks', BenchmarkViewSet, basename='benchmark')
router.register('datasets', DatasetViewSet, basename='dataset')
router.register('integrations/github', GitHubIntegrationViewSet, basename='github-integration')
router.register('audit-logs', AuditLogViewSet, basename='audit-log')
router.register('settings', SystemSettingViewSet, basename='setting')
router.register('cache', CacheViewSet, basename='cache')

urlpatterns = [
    path('', include(router.urls)),
    path('tasks/<str:task_id>/', TaskStatusView.as_view(), name='task-status'),
]
