import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Github, Database, Trash2, Save, RefreshCw, Key, ExternalLink, Download, Upload, Check, X, Eye, EyeOff } from 'lucide-react';
import styles from './Settings.module.css';
import apiKeyManager, { PROVIDERS } from '../utils/apiKeyManager';

export default function Settings() {
    const [formData, setFormData] = useState({
        repository: '',
        branch: 'main',
        base_path: 'prompts/',
        access_token: '',
        is_active: true
    });

    const [clearing, setClearing] = useState(false);

    // API Keys state
    const [providers, setProviders] = useState([]);
    const [editingProvider, setEditingProvider] = useState(null);
    const [newApiKey, setNewApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Fetch GitHub Integration
    const { data: githubIntegration, isLoading: loadingGithub } = useQuery({
        queryKey: ['integrations', 'github'],
        queryFn: () => api.get('/integrations/github/').then(res => res.data[0]),
    });

    // Fetch Cache Stats
    const { data: cacheStats, refetch: refetchCache } = useQuery({
        queryKey: ['cache', 'info'],
        queryFn: () => api.get('/cache/info/').then(res => res.data),
    });

    useEffect(() => {
        if (githubIntegration) {
            setFormData({
                repository: githubIntegration.repository,
                branch: githubIntegration.branch,
                base_path: githubIntegration.base_path,
                access_token: '', // Don't show existing token
                is_active: githubIntegration.is_active
            });
        }
    }, [githubIntegration]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            return githubIntegration
                ? api.patch(`/integrations/github/${githubIntegration.id}/`, data)
                : api.post('/integrations/github/', data);
        },
        onSuccess: () => alert('Settings saved successfully!'),
        onError: (err) => alert('Failed to save settings: ' + err.message)
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData };
        if (!data.access_token) delete data.access_token;
        saveMutation.mutate(data);
    };

    const handleClearCache = async () => {
        if (!confirm('Clear all cached LLM responses? This action cannot be undone.')) {
            return;
        }

        setClearing(true);
        try {
            await api.post('/cache/clear/');
            refetchCache();
            alert('Cache cleared successfully!');
        } catch (error) {
            alert('Failed to clear cache');
        } finally {
            setClearing(false);
        }
    };

    // Load providers on mount
    useEffect(() => {
        const loadedProviders = apiKeyManager.getAllProviders();
        setProviders(loadedProviders);
    }, []);

    // API Key handlers
    const handleSaveApiKey = (providerId) => {
        if (!newApiKey.trim()) {
            alert('Please enter an API key');
            return;
        }

        try {
            apiKeyManager.setKey(providerId, newApiKey);
            setProviders(apiKeyManager.getAllProviders());
            setEditingProvider(null);
            setNewApiKey('');
            setShowKey(false);
            alert('API key saved successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleDeleteApiKey = (providerId) => {
        if (!confirm(`Remove ${PROVIDERS[providerId].name} API key?`)) {
            return;
        }

        apiKeyManager.deleteKey(providerId);
        setProviders(apiKeyManager.getAllProviders());
    };

    const handleExportKeys = () => {
        apiKeyManager.exportKeys();
    };

    const handleImportKeys = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const count = await apiKeyManager.importKeys(file);
            setProviders(apiKeyManager.getAllProviders());
            alert(`Successfully imported ${count} API key(s)`);
        } catch (error) {
            alert(`Import failed: ${error.message}`);
        }

        // Reset file input
        event.target.value = '';
    };

    return (
        <Layout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Settings</h1>
                    <p className={styles.subtitle}>Manage your integrations and preferences.</p>
                </div>

                {/* API Keys Section */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Key size={24} /> API Keys
                        </h2>
                        <div className={styles.sectionActions}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportKeys}
                                icon={Download}
                                disabled={providers.filter(p => p.configured).length === 0}
                            >
                                Export
                            </Button>
                            <label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Upload}
                                    as="span"
                                >
                                    Import
                                </Button>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportKeys}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>
                    <p className={styles.sectionDescription}>
                        🔐 Your API keys are stored securely in your browser. They never leave your device or reach our servers.
                    </p>

                    <div className={styles.providersGrid}>
                        {providers.map((provider) => (
                            <GlassCard key={provider.id} className={styles.providerCard}>
                                <div className={styles.providerHeader}>
                                    <div>
                                        <h3 className={styles.providerName}>{provider.name}</h3>
                                        {provider.configured && (
                                            <span className={styles.badgeConfigured}>
                                                <Check size={14} /> Configured
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href={provider.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.docsLink}
                                        title="Get API Key"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>

                                {provider.configured && editingProvider !== provider.id ? (
                                    <div className={styles.keyDisplay}>
                                        <code className={styles.maskedKey}>{provider.maskedKey}</code>
                                        <div className={styles.keyActions}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingProvider(provider.id);
                                                    setNewApiKey(apiKeyManager.getKey(provider.id));
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteApiKey(provider.id)}
                                                icon={X}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.keyForm}>
                                        <div className={styles.keyInputGroup}>
                                            <Input
                                                type={showKey ? 'text' : 'password'}
                                                placeholder={provider.placeholder}
                                                value={editingProvider === provider.id ? newApiKey : ''}
                                                onChange={(e) => {
                                                    setEditingProvider(provider.id);
                                                    setNewApiKey(e.target.value);
                                                }}
                                                className={styles.keyInput}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(!showKey)}
                                                className={styles.toggleButton}
                                            >
                                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {editingProvider === provider.id && (
                                            <div className={styles.keyFormActions}>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveApiKey(provider.id)}
                                                    icon={Check}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingProvider(null);
                                                        setNewApiKey('');
                                                        setShowKey(false);
                                                    }}
                                                    icon={X}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className={styles.providerModels}>
                                    <small>{provider.models.slice(0, 3).join(', ')}</small>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </section>

                {/* GitHub Integration */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Github size={24} /> GitHub Integration
                    </h2>
                    <GlassCard>
                        <form onSubmit={handleSubmit} className={styles.grid}>
                            <Input
                                label="Repository (owner/repo)"
                                placeholder="username/repo"
                                value={formData.repository}
                                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Branch"
                                    placeholder="main"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                />
                                <Input
                                    label="Base Path"
                                    placeholder="prompts/"
                                    value={formData.base_path}
                                    onChange={(e) => setFormData({ ...formData, base_path: e.target.value })}
                                />
                            </div>
                            <Input
                                label="Personal Access Token"
                                type="password"
                                placeholder={githubIntegration ? "••••••••••••••••" : "ghp_..."}
                                value={formData.access_token}
                                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                            />

                            <div className={styles.actions}>
                                <Button
                                    type="submit"
                                    loading={saveMutation.isPending}
                                    icon={Save}
                                >
                                    Save Configuration
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </section>

                {/* Cache Management */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Database size={24} /> Cache Management
                    </h2>
                    <GlassCard>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{cacheStats?.total_keys || 0}</div>
                                <div className={styles.statLabel}>Cached Items</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{cacheStats?.memory_used_human || '0B'}</div>
                                <div className={styles.statLabel}>Memory Used</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statValue}>{cacheStats?.hit_rate || '0%'}</div>
                                <div className={styles.statLabel}>Hit Rate</div>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button
                                variant="secondary"
                                onClick={() => refetchCache()}
                                icon={RefreshCw}
                            >
                                Refresh Stats
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleClearCache}
                                loading={clearing}
                                icon={Trash2}
                            >
                                Clear My Cache
                            </Button>
                        </div>
                    </GlassCard>
                </section>
            </div>
        </Layout>
    );
}
