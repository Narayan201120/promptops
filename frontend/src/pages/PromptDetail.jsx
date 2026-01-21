import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import TestSandbox from '../components/TestSandbox';
import CompareView from '../components/CompareView';
import Button from '../components/ui/Button';
import { Save, Trash2, GitBranch, History, ArrowLeft, Play, Database, CheckCircle, Cpu, DollarSign, Clock, AlertCircle, GitCompare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './PromptDetail.module.css';

export default function PromptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => promptsAPI.get(id).then(res => res.data),
    onSuccess: (data) => {
      setFormData(data);
      setIsDirty(false);
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (prompt) {
      setFormData(prompt);
    }
  }, [prompt]);

  const updateMutation = useMutation({
    mutationFn: (data) => promptsAPI.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['prompt', id], data);
      setIsDirty(false);
      alert('Prompt saved successfully');
    },
    onError: (err) => alert('Failed to save: ' + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: () => promptsAPI.delete(id),
    onSuccess: () => navigate('/prompts'),
  });

  const pushToGithubMutation = useMutation({
    mutationFn: (data) => promptsAPI.pushToGithub(id, data),
    onSuccess: () => alert('Sync started! Check GitHub in a moment.'),
    onError: (err) => alert('Sync failed: ' + (err.response?.data?.error || err.message)),
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      deleteMutation.mutate();
    }
  };

  const handlePushToGithub = () => {
    const message = window.prompt('Enter commit message:', `Update prompt ${prompt.title}`);
    if (message) {
      pushToGithubMutation.mutate({ commit_message: message });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading prompt...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleSection}>
            <input
              className={styles.titleInput}
              value={formData.title || ''}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Prompt Title"
            />
            <div className={styles.meta}>
              <span>v{prompt?.current_version}</span>
              <span>•</span>
              <span>Updated {new Date(prompt?.updated_at).toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="ghost"
              onClick={() => navigate('/prompts')}
              icon={ArrowLeft}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/prompts/${id}/versions`)}
              icon={History}
            >
              History
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/prompts/${id}/batch`)}
              icon={Database} // Using Database icon for Batch
            >
              Batch
            </Button>
            <Button
              variant="secondary"
              onClick={handlePushToGithub}
              loading={pushToGithubMutation.isPending}
              icon={GitBranch}
            >
              Sync
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              icon={Trash2}
            >
              Delete
            </Button>
            <Button
              onClick={() => setShowCompare(true)}
              icon={GitCompare}
              variant="primary"
            >
              Compare
            </Button>
            <Button
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!isDirty}
              icon={Save}
            >
              Save
            </Button>
          </div>
        </header>

        {/* Workspace */}
        <div className={styles.workspace}>
          {/* Editor Pane */}
          <div className={styles.editorPane}>
            <div className={styles.editorToolbar}>
              <span className={styles.editorLabel}>Prompt Template</span>
            </div>
            <textarea
              className={styles.editor}
              value={formData.content || ''}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Enter your prompt here... Use {{variable}} for dynamic values."
              spellCheck={false}
            />
          </div>

          {/* Sidebar Pane */}
          <div className={styles.sidebarPane}>
            <div>
              <label className={styles.editorLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                className={styles.descriptionInput}
                rows={3}
                value={formData.description || ''}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Describe what this prompt does..."
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <TestSandbox
                promptId={id}
                promptContent={formData.content || ''}
                showResponseInline={false}
                onResultChange={(result) => setTestResult(result)}
              />
            </div>
          </div>
        </div>

        {/* Full-width Response Section */}
        {testResult && testResult.status === 'success' && (
          <div className={styles.responseSection}>
            <div className={styles.responseHeader}>
              <CheckCircle size={18} className="text-green-400" /> Response
            </div>
            <div className={styles.responseContent}>
              <ReactMarkdown>{testResult.response}</ReactMarkdown>
            </div>
            <div className={styles.responseMetrics}>
              <div className={styles.responseMetric}>
                <div className={styles.responseMetricLabel}><Cpu size={12} /> Tokens</div>
                <div className={styles.responseMetricValue}>{testResult.tokens}</div>
              </div>
              <div className={styles.responseMetric}>
                <div className={styles.responseMetricLabel}><DollarSign size={12} /> Cost</div>
                <div className={styles.responseMetricValue}>${testResult.cost.toFixed(4)}</div>
              </div>
              <div className={styles.responseMetric}>
                <div className={styles.responseMetricLabel}><Clock size={12} /> Latency</div>
                <div className={styles.responseMetricValue}>{testResult.latency_ms}ms</div>
              </div>
            </div>
          </div>
        )}

        {testResult && testResult.status === 'error' && (
          <div className={styles.responseError}>
            <div className="flex items-center gap-2 mb-2 font-bold">
              <AlertCircle size={18} /> Error
            </div>
            {testResult.error}
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {showCompare && (
        <div className={styles.modal}>
          <div className={styles.modalOverlay} onClick={() => setShowCompare(false)} />
          <div className={styles.modalContent}>
            <CompareView prompt={prompt} onClose={() => setShowCompare(false)} />
          </div>
        </div>
      )}
    </Layout>
  );
}
