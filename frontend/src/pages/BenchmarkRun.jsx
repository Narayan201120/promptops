import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

const AVAILABLE_MODELS = [
    { provider: 'openai', model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { provider: 'openai', model: 'gpt-4', name: 'GPT-4' },
    { provider: 'anthropic', model: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { provider: 'anthropic', model: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
];

export default function BenchmarkRun() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedModels, setSelectedModels] = useState([]);
    const [variables, setVariables] = useState('{}');

    const { data: prompt, isLoading } = useQuery({
        queryKey: ['prompt', id],
        queryFn: () => promptsAPI.get(id).then(res => res.data),
    });

    const runBenchmarkMutation = useMutation({
        mutationFn: (data) => promptsAPI.runBenchmark(id, data),
        onSuccess: (res) => {
            navigate(`/benchmarks/${res.data.benchmark_id}`);
        },
    });

    const handleModelToggle = (modelConfig) => {
        const exists = selectedModels.find(
            m => m.provider === modelConfig.provider && m.model === modelConfig.model
        );

        if (exists) {
            setSelectedModels(selectedModels.filter(
                m => !(m.provider === modelConfig.provider && m.model === modelConfig.model)
            ));
        } else {
            setSelectedModels([...selectedModels, modelConfig]);
        }
    };

    const handleRun = () => {
        try {
            const parsedVariables = JSON.parse(variables);
            runBenchmarkMutation.mutate({
                models: selectedModels,
                variables: parsedVariables,
            });
        } catch (e) {
            alert('Invalid JSON variables');
        }
    };

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-navy-900 mb-6">Run Benchmark</h2>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-xl font-semibold mb-4">1. Select Models</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {AVAILABLE_MODELS.map((model) => {
                            const isSelected = selectedModels.find(
                                m => m.provider === model.provider && m.model === model.model
                            );
                            return (
                                <div
                                    key={`${model.provider}-${model.model}`}
                                    onClick={() => handleModelToggle(model)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                                            : 'border-gray-200 hover:border-teal-300'
                                        }`}
                                >
                                    <div className="font-medium text-navy-900">{model.name}</div>
                                    <div className="text-xs text-gray-500 uppercase">{model.provider}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-xl font-semibold mb-4">2. Test Variables (JSON)</h3>
                    <textarea
                        className="w-full h-32 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        value={variables}
                        onChange={(e) => setVariables(e.target.value)}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleRun}
                        disabled={selectedModels.length === 0 || runBenchmarkMutation.isPending}
                        className="btn-primary px-8 py-3 text-lg"
                    >
                        {runBenchmarkMutation.isPending ? 'Starting...' : 'Run Benchmark'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}
