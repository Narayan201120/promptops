from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptViewSet, TestRunViewSet
from .task_views import TaskStatusView

router = DefaultRouter()
router.register('prompts', PromptViewSet, basename='prompt')
router.register('test-runs', TestRunViewSet, basename='testrun')

urlpatterns = [
    path('', include(router.urls)),
    path('tasks/<str:task_id>/', TaskStatusView.as_view(), name='task-status'),
]
