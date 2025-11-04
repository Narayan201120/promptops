import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import TestSandbox from '../components/TestSandbox';

export default function PromptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => promptsAPI.get(id).then(res => res.data),
    onSuccess: (data) => setFormData(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => promptsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prompt', id]);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => promptsAPI.delete(id),
    onSuccess: () => navigate('/'),
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center py-12">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  className="text-2xl font-bold w-full border-b-2 border-blue-500 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              ) : (
                <h1 className="text-2xl font-bold">{prompt.title}</h1>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Version {prompt.current_version} • Updated {new Date(prompt.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                to={`/prompts/${id}/versions`}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                History
              </Link>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              ) : (
                <p className="text-gray-600">{prompt.description || 'No description'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              {isEditing ? (
                <textarea
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              ) : (
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto font-mono text-sm">
                  {prompt.content}
                </pre>
              )}
            </div>
          </div>

          {updateMutation.isError && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded">
              {updateMutation.error.response?.data?.detail || 'Failed to update prompt'}
            </div>
          )}

          {!isEditing && (
            <div className="mt-6">
              <TestSandbox promptId={id} promptContent={prompt.content} />
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <div className="space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(prompt);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
