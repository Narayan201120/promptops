import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { Plus, Activity, Zap, Database, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptsAPI.list().then(res => res.data),
  });

  const stats = [
    { label: 'Total Prompts', value: data?.count || 0, change: '+12%', icon: Database },
    { label: 'API Calls (24h)', value: '1,234', change: '+5%', icon: Activity },
    { label: 'Avg Latency', value: '145ms', change: '-12ms', icon: Zap, isPositive: true },
    { label: 'Success Rate', value: '99.8%', change: '+0.2%', icon: Clock },
  ];

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.first_name || 'User'}</h1>
          <p className={styles.subtitle}>Here's what's happening with your prompts today.</p>
        </div>
        <Link to="/prompts/new">
          <Button icon={Plus}>New Prompt</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <GlassCard key={index} hoverable>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-slate-800/50 text-cyan-400">
                <stat.icon size={20} />
              </div>
              <span className={`${styles.statChange} ${stat.isPositive ? styles.positive : styles.positive}`}>
                {stat.change}
              </span>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Recent Prompts */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Prompts</h2>
        <Link to="/prompts">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className={styles.promptsGrid}>
          {data?.results?.slice(0, 6).map((prompt) => (
            <Link key={prompt.id} to={`/prompts/${prompt.id}`}>
              <GlassCard hoverable className={styles.promptCard}>
                <div className={styles.promptHeader}>
                  <h3 className={styles.promptTitle}>{prompt.title}</h3>
                  <span className={styles.versionBadge}>v{prompt.current_version}</span>
                </div>
                <p className={styles.promptDesc}>
                  {prompt.description || 'No description provided.'}
                </p>
                <div className={styles.promptFooter}>
                  <span>Updated {new Date(prompt.updated_at).toLocaleDateString()}</span>
                  <span className="text-cyan-400">OpenAI</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
