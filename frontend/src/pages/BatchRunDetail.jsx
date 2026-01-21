import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BatchRunDetail() {
    const { id } = useParams();

    // Fetch test runs associated with this batch run
    // Note: Ideally we'd have a specific endpoint for batch run details + stats
    // For now, we'll use the test-runs list filtered by batch_run
    const { data: testRunsData, isLoading } = useQuery({
        queryKey: ['batch-run', id],
        queryFn: () => promptsAPI.getBatchRun(id).then(res => res.data),
        refetchInterval: 2000, // Poll for updates
    });

    if (isLoading) return <Layout><LoadingSpinner /></Layout>;

    const results = testRunsData?.results || [];
    const completedCount = results.filter(r => r.response).length;
    const totalCount = results.length; // This might be inaccurate if pagination is on, but for MVP it's okay
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Calculate stats
    const totalCost = results.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0);
    const avgLatency = results.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (results.length || 1);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Batch Run Results</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ID: {id}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Progress</div>
                        <div className="text-2xl font-bold text-navy-900">{Math.round(progress)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Total Cost</div>
                        <div className="text-2xl font-bold text-navy-900">${totalCost.toFixed(4)}</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Avg Latency</div>
                        <div className="text-2xl font-bold text-navy-900">{Math.round(avgLatency)}ms</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full bg-white shadow-sm rounded-lg overflow-hidden">
                        <thead className="bg-navy-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Variables</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {results.map((run) => (
                                <tr key={run.id}>
                                    <td className="px-6 py-4">
                                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            {JSON.stringify(run.input_variables, null, 2)}
                                        </pre>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
