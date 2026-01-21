import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import { datasetsAPI } from '../api/datasets';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Database, Play, ArrowRight, Settings, ArrowLeft } from 'lucide-react';
import styles from './BatchRunConfig.module.css';

export default function BatchRunConfig() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [variableMapping, setVariableMapping] = useState({});
    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-2.5-flash');

    const { data: prompt, isLoading: isPromptLoading } = useQuery({
        queryKey: ['prompt', id],
        queryFn: () => promptsAPI.get(id).then(res => res.data),
    });

    const { data: datasets, isLoading: isDatasetsLoading } = useQuery({
        queryKey: ['datasets'],
        queryFn: () => datasetsAPI.list().then(res => res.data),
    });

    const runBatchMutation = useMutation({
        mutationFn: (data) => promptsAPI.runBatch(id, data),
        onSuccess: (res) => {
            navigate(`/batch-runs/${res.data.batch_run_id}`);
        },
    });

    const handleDatasetChange = (e) => {
        setSelectedDatasetId(e.target.value);
        setVariableMapping({}); // Reset mapping
    };

    const handleMappingChange = (promptVar, csvCol) => {
        setVariableMapping(prev => ({
            ...prev,
            [promptVar]: csvCol
        }));
    };

    if (isPromptLoading || isDatasetsLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full text-cyan-400">Loading configuration...</div>
            </Layout>
        );
    }

    const selectedDataset = datasets?.results?.find(d => d.id === selectedDatasetId);
    const datasetColumns = selectedDataset?.data && selectedDataset.data.length > 0
        ? Object.keys(selectedDataset.data[0])
        : [];

    const promptVariables = prompt?.content?.match(/{([^}]+)}/g)?.map(v => v.replace(/{|}/g, '')) || [];
    const uniquePromptVariables = [...new Set(promptVariables)];

    return (
        <Layout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Configure Batch Run</h1>
                        <p className={styles.subtitle}>Run "{prompt?.title}" against a dataset</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/prompts/${id}`)}
                        icon={ArrowLeft}
                    >
                        Back
                    </Button>
                </div>

                <GlassCard className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Database size={20} /> 1. Select Dataset
                    </h2>
                    <select
                        className={styles.select}
                        value={selectedDatasetId}
                        onChange={handleDatasetChange}
                    >
                        <option value="">-- Select a Dataset --</option>
                        {datasets?.results?.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.data?.length || 0} rows)</option>
                        ))}
                    </select>
                </GlassCard>

                {selectedDataset && (
                    <GlassCard className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <ArrowRight size={20} /> 2. Map Variables
                        </h2>
                        <p className={styles.description}>
                            Map variables in your prompt to columns in the CSV dataset.
                        </p>

                        <div className={styles.mappingGrid}>
                            {uniquePromptVariables.map(variable => (
                                <div key={variable} className={styles.mappingRow}>
                                    <div className={styles.variable}>
                                        {`{${variable}}`}
                                    </div>
                                    <ArrowRight size={16} className={styles.arrow} />
                                    <div className={styles.columnSelect}>
                                        <select
                                            className={styles.select}
                                            value={variableMapping[variable] || ''}
                                            onChange={(e) => handleMappingChange(variable, e.target.value)}
                                        >
                                            <option value="">-- Select Column --</option>
                                            {datasetColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                            {uniquePromptVariables.length === 0 && (
                                <p className="text-gray-500 italic">No variables found in prompt.</p>
                            )}
                        </div>
                    </GlassCard>
                )}

                <GlassCard className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Settings size={20} /> 3. Model Configuration
                    </h2>
                    <div className={styles.grid}>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Provider</label>
                            <select
                                className={styles.select}
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            >
                                <option value="openai">OpenAI</option>
                                <option value="gemini">Gemini</option>
                            </select>
                        </div>
                        <Input
                            label="Model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        />
                    </div>
                </GlassCard>

                <div className={styles.actions}>
                    <Button
                        onClick={() => runBatchMutation.mutate({
                            dataset_id: selectedDatasetId,
                            variable_mapping: variableMapping,
                            provider,
                            model
                        })}
                        disabled={!selectedDatasetId || runBatchMutation.isPending}
                        loading={runBatchMutation.isPending}
                        size="lg"
                        icon={Play}
                    >
                        Start Batch Run
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
