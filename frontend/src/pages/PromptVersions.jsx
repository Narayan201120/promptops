import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import styles from './PromptVersions.module.css';

export default function PromptVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prompt } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => promptsAPI.get(id).then(res => res.data),
  });

  const { data: versions, isLoading } = useQuery({
    queryKey: ['versions', id],
    queryFn: () => promptsAPI.getVersions(id).then(res => res.data),
  });

  const revertMutation = useMutation({
    mutationFn: (versionId) => promptsAPI.revert(id, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['prompt', id]);
      queryClient.invalidateQueries(['versions', id]);
      navigate(`/prompts/${id}`);
    },
  });

  const handleRevert = (versionId) => {
    if (window.confirm('Revert to this version? This will create a new version.')) {
      revertMutation.mutate(versionId);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-cyan-400">Loading versions...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Version History</h1>
            <p className={styles.subtitle}>{prompt?.title}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/prompts/${id}`)}
            icon={ArrowLeft}
          >
            Back to Prompt
          </Button>
        </div>

        <div className={styles.list}>
          {versions?.map((version, index) => (
            <GlassCard key={version.id} className={styles.versionCard}>
              <div className={styles.versionHeader}>
                <div>
                  <div className={styles.versionInfo}>
                    <span className={styles.versionNumber}>v{version.version_number}</span>
                    {index === 0 && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </div>
                  <p className={styles.versionMeta}>
                    {new Date(version.created_at).toLocaleString()} by{' '}
                    {version.created_by?.email || 'Unknown'}
                  </p>
                </div>
                {index !== 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRevert(version.id)}
                    loading={revertMutation.isPending}
                    icon={RotateCcw}
                  >
                    Revert
                  </Button>
                )}
              </div>
              <pre className={styles.content}>
                {version.content}
              </pre>
            </GlassCard>
          ))}
        </div>

        {revertMutation.isError && (
          <div className={styles.error}>
            Failed to revert version
          </div>
        )}
      </div>
    </Layout>
  );
}
