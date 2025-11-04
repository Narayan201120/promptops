import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: () => promptsAPI.list().then(res => res.data),
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Prompts</h2>
            <Link
              to="/prompts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Prompt
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12"><LoadingSpinner size="lg" /></div>
          ) : data?.results?.length === 0 ? (
            <EmptyState
              title="No prompts yet"
              description="Create your first prompt to get started"
              actionText="Create Prompt"
              actionLink="/prompts/new"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.results?.map((prompt) => (
                <Link
                  key={prompt.id}
                  to={`/prompts/${prompt.id}`}
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold mb-2">{prompt.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {prompt.description || 'No description'}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>v{prompt.current_version}</span>
                    <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
