import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../api/analytics';
import Layout from '../components/Layout';

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsAPI.getSummary().then(res => res.data),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsAPI.getTrends(30).then(res => res.data),
  });

  const { data: topPrompts, isLoading: topLoading } = useQuery({
    queryKey: ['top-prompts'],
    queryFn: () => analyticsAPI.getTopPrompts().then(res => res.data),
  });

  if (summaryLoading || trendsLoading || topLoading) {
    return <Layout><div className="flex items-center justify-center py-12">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Prompts</div>
            <div className="text-3xl font-bold">{summary?.total_prompts || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Tests</div>
            <div className="text-3xl font-bold">{summary?.total_tests || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Cost</div>
            <div className="text-3xl font-bold">${(summary?.total_cost || 0).toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Avg Latency</div>
            <div className="text-3xl font-bold">{summary?.avg_latency || 0}ms</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Test Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Test Activity (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends?.daily_tests || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Costs (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends?.daily_costs || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Provider Usage</h2>
            <div className="space-y-3">
              {summary?.provider_stats?.map((stat) => (
                <div key={stat.provider} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium capitalize">{stat.provider}</div>
                    <div className="text-sm text-gray-500">{stat.count} tests</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${(stat.total_cost || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Prompts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Top Prompts</h2>
            <div className="space-y-3">
              {topPrompts?.slice(0, 5).map((prompt) => (
                <div key={prompt.id} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{prompt.title}</div>
                    <div className="text-sm text-gray-500">{prompt.test_count} tests</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold">${prompt.total_cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{prompt.avg_latency}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
