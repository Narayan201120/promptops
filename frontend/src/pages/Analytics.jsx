import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../api/analytics';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import styles from './Analytics.module.css';

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
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-cyan-400">Loading analytics...</div>
      </Layout>
    );
  }

  const chartTheme = {
    stroke: '#64748b',
    fill: '#1e293b',
    text: '#94a3b8'
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Analytics</h1>
        </div>

        <div className={styles.grid}>
          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <GlassCard className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Prompts</span>
              <span className={styles.summaryValue}>{summary?.total_prompts || 0}</span>
            </GlassCard>
            <GlassCard className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Tests</span>
              <span className={styles.summaryValue}>{summary?.total_tests || 0}</span>
            </GlassCard>
            <GlassCard className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Cost</span>
              <span className={styles.summaryValue}>${(summary?.total_cost || 0).toFixed(2)}</span>
            </GlassCard>
            <GlassCard className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Avg Latency</span>
              <span className={styles.summaryValue}>{summary?.avg_latency || 0}ms</span>
            </GlassCard>
          </div>

          {/* Charts */}
          <div className={styles.chartsGrid}>
            <GlassCard className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Test Activity (30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends?.daily_tests || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke={chartTheme.text} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartTheme.text} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Daily Costs (30 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends?.daily_costs || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke={chartTheme.text} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartTheme.text} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Stats Lists */}
          <div className={styles.chartsGrid}>
            <GlassCard className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Provider Usage</h2>
              <div className={styles.list}>
                {summary?.provider_stats?.map((stat) => (
                  <div key={stat.provider} className={styles.listItem}>
                    <div>
                      <div className={styles.itemName} style={{ textTransform: 'capitalize' }}>{stat.provider}</div>
                      <div className={styles.itemSub}>{stat.count} tests</div>
                    </div>
                    <div>
                      <div className={styles.itemValue}>${(stat.total_cost || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className={styles.chartCard}>
              <h2 className={styles.cardTitle}>Top Prompts</h2>
              <div className={styles.list}>
                {topPrompts?.slice(0, 5).map((prompt) => (
                  <div key={prompt.id} className={styles.listItem}>
                    <div>
                      <div className={styles.itemName}>{prompt.title}</div>
                      <div className={styles.itemSub}>{prompt.test_count} tests</div>
                    </div>
                    <div>
                      <div className={styles.itemValue}>${prompt.total_cost.toFixed(2)}</div>
                      <div className={styles.itemSubValue}>{prompt.avg_latency}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
