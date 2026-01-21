import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, X, DollarSign, Zap, Hash, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import apiKeyManager from '../utils/apiKeyManager';
import styles from './CompareView.module.css';

export default function CompareView({ prompt, onClose }) {
    const [selectedProviders, setSelectedProviders] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const configuredProviders = apiKeyManager.getConfiguredProviders();

    const toggleProvider = (provider) => {
        setSelectedProviders(prev =>
            prev.includes(provider)
                ? prev.filter(p => p !== provider)
                : [...prev, provider]
        );
    };

    const runComparison = async () => {
        if (selectedProviders.length < 2) {
            setError('Please select at least 2 providers');
            return;
        }

        setIsRunning(true);
        setError(null);
        setResults(null);

        try {
            // Prepare API keys
            const apiKeys = {};
            selectedProviders.forEach(provider => {
                apiKeys[provider] = apiKeyManager.getKey(provider);
            });

            // Get API base URL
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

            const response = await fetch(`${API_BASE_URL}/prompts/${prompt.id}/compare/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'X-API-Keys': JSON.stringify(apiKeys)
                },
                body: JSON.stringify({
                    providers: selectedProviders,
                    variables: {}
                })
            });

            // Better error handling
            if (!response.ok) {
                const text = await response.text();
                let errorMessage;
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || errorData.detail || 'Comparison failed';
                } catch {
                    errorMessage = `Server error: ${response.status} - ${text || 'Unknown error'}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Poll for results
            const taskId = data.task_id;
            const pollResults = async () => {
                const statusRes = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                const statusData = await statusRes.json();

                if (statusData.status === 'SUCCESS') {
                    setResults(statusData.result);
                    setIsRunning(false);
                } else if (statusData.status === 'FAILURE') {
                    throw new Error('Comparison task failed');
                } else {
                    setTimeout(pollResults, 2000);
                }
            };

            pollResults();
        } catch (err) {
            setError(err.message);
            setIsRunning(false);
        }
    };

    return (
        <div className={styles.compareView}>
            <div className={styles.header}>
                <h2>Compare Providers</h2>
                <button onClick={onClose} className={styles.closeButton}>
                    <X size={20} />
                </button>
            </div>

            <div className={styles.layout}>
                {/* Left Sidebar - Controls */}
                <div className={styles.sidebar}>
                    <div className={styles.providerSelection}>
                        <h3>Select Providers (minimum 2)</h3>
                        <div className={styles.providerList}>
                            {configuredProviders.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => toggleProvider(provider.id)}
                                    className={`${styles.providerCard} ${selectedProviders.includes(provider.id) ? styles.selected : ''}`}
                                >
                                    <span>{provider.name}</span>
                                    {selectedProviders.includes(provider.id) && (
                                        <Check size={18} className={styles.checkIcon} />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className={styles.selectedCount}>
                            {selectedProviders.length} provider{selectedProviders.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>

                    {/* Run Button */}
                    <button
                        onClick={runComparison}
                        disabled={selectedProviders.length < 2 || isRunning}
                        className={styles.runButton}
                    >
                        {isRunning ? (
                            <>
                                <div className={styles.spinner} />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play size={20} />
                                Run Comparison
                            </>
                        )}
                    </button>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Panel - Results */}
                <div className={styles.resultsPanel}>
                    {/* Prompt Display */}
                    <div className={styles.promptDisplay}>
                        <h3>Prompt</h3>
                        <div className={styles.promptContent}>
                            <ReactMarkdown>{prompt.content}</ReactMarkdown>
                        </div>
                    </div>

                    {results && (
                        <motion.div
                            className={styles.results}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3>Comparison Results</h3>

                            <div className={styles.resultsGrid}>
                                {Object.entries(results.results).map(([provider, result]) => (
                                    <motion.div
                                        key={provider}
                                        className={`${styles.resultCard} ${result.status === 'error' ? styles.errorCard : ''}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className={styles.resultHeader}>
                                            <h4>{provider}</h4>
                                            <div className={styles.badges}>
                                                {results.winners.cheapest === provider && (
                                                    <div className={styles.winner} title="Cheapest">
                                                        <DollarSign size={16} />
                                                    </div>
                                                )}
                                                {results.winners.fastest === provider && (
                                                    <div className={styles.winner} title="Fastest">
                                                        <Zap size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {result.status === 'success' ? (
                                            <>
                                                <div className={styles.response}>
                                                    <ReactMarkdown>
                                                        {result.response}
                                                    </ReactMarkdown>
                                                </div>

                                                <div className={styles.stats}>
                                                    <div className={styles.stat}>
                                                        <DollarSign size={14} />
                                                        <span>${result.cost.toFixed(4)}</span>
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <Zap size={14} />
                                                        <span>{result.latency_ms}ms</span>
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <Hash size={14} />
                                                        <span>{result.tokens} tokens</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={styles.errorMessage}>
                                                {result.error}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
