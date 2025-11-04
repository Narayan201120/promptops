from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from prompts.models import Prompt, TestRun


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tenant = request.user.tenant
        
        # Total counts
        total_prompts = Prompt.objects.filter(tenant=tenant, is_archived=False).count()
        total_tests = TestRun.objects.filter(prompt__tenant=tenant).count()
        
        # Cost and tokens
        test_stats = TestRun.objects.filter(prompt__tenant=tenant).aggregate(
            total_cost=Sum('cost'),
            total_tokens=Sum('tokens_used'),
            avg_latency=Avg('latency_ms')
        )
        
        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_tests = TestRun.objects.filter(
            prompt__tenant=tenant,
            created_at__gte=thirty_days_ago
        ).count()
        
        # Provider breakdown
        provider_stats = TestRun.objects.filter(prompt__tenant=tenant).values('provider').annotate(
            count=Count('id'),
            total_cost=Sum('cost')
        )
        
        return Response({
            'total_prompts': total_prompts,
            'total_tests': total_tests,
            'recent_tests': recent_tests,
            'total_cost': float(test_stats['total_cost'] or 0),
            'total_tokens': test_stats['total_tokens'] or 0,
            'avg_latency': int(test_stats['avg_latency'] or 0),
            'provider_stats': list(provider_stats),
        })


class AnalyticsTrendsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tenant = request.user.tenant
        days = int(request.query_params.get('days', 30))
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Daily test counts
        daily_tests = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            count = TestRun.objects.filter(
                prompt__tenant=tenant,
                created_at__gte=date,
                created_at__lt=next_date
            ).count()
            daily_tests.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        # Daily costs
        daily_costs = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            cost = TestRun.objects.filter(
                prompt__tenant=tenant,
                created_at__gte=date,
                created_at__lt=next_date
            ).aggregate(total=Sum('cost'))['total'] or 0
            daily_costs.append({
                'date': date.strftime('%Y-%m-%d'),
                'cost': float(cost)
            })
        
        return Response({
            'daily_tests': daily_tests,
            'daily_costs': daily_costs,
        })


class TopPromptsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tenant = request.user.tenant
        
        # Top prompts by test count
        top_prompts = Prompt.objects.filter(tenant=tenant).annotate(
            test_count=Count('test_runs')
        ).order_by('-test_count')[:10]
        
        results = []
        for prompt in top_prompts:
            stats = TestRun.objects.filter(prompt=prompt).aggregate(
                total_cost=Sum('cost'),
                avg_latency=Avg('latency_ms')
            )
            results.append({
                'id': str(prompt.id),
                'title': prompt.title,
                'test_count': prompt.test_count,
                'total_cost': float(stats['total_cost'] or 0),
                'avg_latency': int(stats['avg_latency'] or 0),
            })
        
        return Response(results)
