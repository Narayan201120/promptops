import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BenchmarkDetail() {
    const { id } = useParams();

    const { data: benchmark, isLoading } = useQuery({
        queryKey: ['benchmark', id],
        queryFn: () => promptsAPI.getBenchmark(id).then(res => res.data),
        refetchInterval: (data) => {
            // Stop polling if all runs are complete (this is a simplification, ideally check status)
            // For now, just poll every 2 seconds
            return 2000;
        },
    });

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">{benchmark.name}</h2>
                    <p className="text-gray-500">
                        Ran on {new Date(benchmark.created_at).toLocaleString()}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full bg-white shadow-sm rounded-lg overflow-hidden">
                        <thead className="bg-navy-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {benchmark.test_runs.map((run) => (
                                <tr key={run.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-navy-900">{run.model}</div>
                                        <div className="text-xs text-gray-500">{run.provider}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {run.response || <span className="text-gray-400 italic">Running...</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {run.latency_ms ? `${run.latency_ms}ms` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {run.cost ? `$${parseFloat(run.cost).toFixed(6)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {run.tokens_used || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
