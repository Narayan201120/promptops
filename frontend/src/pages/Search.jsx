import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { promptsAPI } from '../api/prompts';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Search() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('keyword'); // 'keyword' or 'semantic'
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading } = useQuery({
        queryKey: ['prompts', 'search', debouncedQuery, searchType],
        queryFn: () => {
            if (!debouncedQuery) return { results: [] };
            return promptsAPI.list({
                search: debouncedQuery,
                type: searchType
            }).then(res => res.data);
        },
        enabled: !!debouncedQuery,
    });

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-navy-900 mb-6">Search Prompts</h2>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-grow">
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setDebouncedQuery(query);
                                    }
                                }}
                            />
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${searchType === 'keyword'
                                        ? 'bg-navy-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => setSearchType('keyword')}
                            >
                                Keyword
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${searchType === 'semantic'
                                        ? 'bg-teal-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => setSearchType('semantic')}
                            >
                                Semantic
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                        {searchType === 'semantic' ? (
                            <p>Finding prompts by meaning using AI embeddings.</p>
                        ) : (
                            <p>Finding prompts by exact text match.</p>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-12"><LoadingSpinner size="lg" /></div>
                ) : (
                    <div className="space-y-4">
                        {data?.results?.map((prompt) => (
                            <Link
                                key={prompt.id}
                                to={`/prompts/${prompt.id}`}
                                className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-navy-900 mb-2">
                                            {prompt.title}
                                        </h3>
                                        <p className="text-gray-600 mb-3 line-clamp-2">
                                            {prompt.description || 'No description'}
                                        </p>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded">v{prompt.current_version}</span>
                                            <span>Updated {new Date(prompt.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {searchType === 'semantic' && prompt.distance !== undefined && (
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm font-bold text-teal-600">
                                                {Math.round((1 - prompt.distance) * 100)}% Match
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Similarity Score
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}

                        {debouncedQuery && data?.results?.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No prompts found. Try a different query.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
