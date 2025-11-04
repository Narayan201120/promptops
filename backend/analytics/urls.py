from django.urls import path
from .views import AnalyticsSummaryView, AnalyticsTrendsView, TopPromptsView

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('trends/', AnalyticsTrendsView.as_view(), name='analytics-trends'),
    path('top-prompts/', TopPromptsView.as_view(), name='top-prompts'),
]
