import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';

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
    return <Layout><div className="flex items-center justify-center py-12">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Version History</h1>
              <p className="text-gray-600">{prompt?.title}</p>
            </div>
            <button
              onClick={() => navigate(`/prompts/${id}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
          </div>

          <div className="space-y-4">
            {versions?.map((version, index) => (
              <div
                key={version.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Version {version.version_number}</span>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(version.created_at).toLocaleString()} by{' '}
                      {version.created_by?.email || 'Unknown'}
                    </p>
                  </div>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRevert(version.id)}
                      disabled={revertMutation.isPending}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Revert
                    </button>
                  )}
                </div>
                <pre className="bg-gray-50 p-3 rounded text-sm font-mono overflow-x-auto">
                  {version.content}
                </pre>
              </div>
            ))}
          </div>

          {revertMutation.isError && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded">
              Failed to revert version
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
