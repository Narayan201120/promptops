import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsAPI } from '../api/datasets';
import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import CSVUploader from '../components/CSVUploader';
import { Upload, Database, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Papa from 'papaparse';
import styles from './Datasets.module.css';

export default function Datasets() {
    const [isUploading, setIsUploading] = useState(false);
    const [expandedDatasets, setExpandedDatasets] = useState(new Set());
    const queryClient = useQueryClient();

    const { data: datasets, isLoading } = useQuery({
        queryKey: ['datasets'],
        queryFn: () => datasetsAPI.list().then(res => res.data),
    });

    const createDatasetMutation = useMutation({
        mutationFn: datasetsAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['datasets']);
            setIsUploading(false);
        },
    });

    const handleUpload = (file) => {
        setIsUploading(true);
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const data = {
                    name: file.name,
                    description: `Imported from ${file.name}`,
                    data: results.data,
                };
                createDatasetMutation.mutate(data);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                alert('Error parsing CSV file');
                setIsUploading(false);
            }
        });
    };

    const toggleExpanded = (datasetId) => {
        const newExpanded = new Set(expandedDatasets);
        if (newExpanded.has(datasetId)) {
            newExpanded.delete(datasetId);
        } else {
            newExpanded.add(datasetId);
        }
        setExpandedDatasets(newExpanded);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Skeleton width={200} height={40} />
                    </div>
                    <Skeleton width="100%" height={200} className="mb-8" />
                    <div className={styles.grid}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} height={200} />
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Datasets</h1>
                </div>

                <div className="mb-8">
                    <CSVUploader onUpload={handleUpload} isUploading={isUploading} />
                </div>

                <div className={styles.grid}>
                    {datasets?.results?.map((dataset) => {
                        const isExpanded = expandedDatasets.has(dataset.id);
                        const columns = dataset.data && dataset.data.length > 0 ? Object.keys(dataset.data[0]) : [];

                        return (
                            <GlassCard key={dataset.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database size={16} className="text-cyan-400" />
                                        <h3 className={styles.cardTitle}>{dataset.name}</h3>
                                    </div>
                                    <p className={styles.cardDesc}>{dataset.description}</p>
                                </div>

                                <div className={styles.columnsSection}>
                                    <button
                                        className={styles.columnsToggle}
                                        onClick={() => toggleExpanded(dataset.id)}
                                    >
                                        <span className={styles.columnsLabel}>Columns ({columns.length})</span>
                                        {isExpanded ? (
                                            <ChevronUp size={14} />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )}
                                    </button>
                                    <div className={`${styles.columns} ${isExpanded ? styles.columnsExpanded : ''}`}>
                                        {columns.length > 0 ? columns.join(', ') : 'None'}
                                    </div>
                                </div>

                                <div className={styles.cardMeta}>
                                    <span className="flex items-center gap-1">
                                        <FileText size={12} />
                                        {dataset.data?.length || 0} records
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(dataset.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </GlassCard>
                        );
                    })}

                    {datasets?.results?.length === 0 && (
                        <div className={styles.emptyState}>
                            <Database size={48} className="mx-auto mb-4 text-slate-600" />
                            <p>No datasets found. Upload a CSV file to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
