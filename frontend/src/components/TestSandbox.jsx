import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { promptsAPI } from '../api/prompts';
import { tasksAPI } from '../api/tasks';

export default function TestSandbox({ promptId, promptContent }) {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState(null);
  const [taskId, setTaskId] = useState(null);

  const models = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
  };

  const extractVariables = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
  };

  const varNames = extractVariables(promptContent);

  const testMutation = useMutation({
    mutationFn: (data) => promptsAPI.test(promptId, data),
    onSuccess: (response) => {
      setTaskId(response.data.task_id);
      setResult({ status: 'pending' });
    },
  });

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await tasksAPI.getStatus(taskId);
        if (data.status === 'completed') {
          setResult(data.result);
          setTaskId(null);
        } else if (data.status === 'failed') {
          setResult({ status: 'error', error: data.error });
          setTaskId(null);
        }
      } catch (error) {
        console.error('Error checking task status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  const handleTest = () => {
    setResult(null);
    testMutation.mutate({ provider, model, variables });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Test Sandbox</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setModel(models[e.target.value][0]);
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {models[provider].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {varNames.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables
            </label>
            <div className="space-y-2">
              {varNames.map((varName) => (
                <input
                  key={varName}
                  type="text"
                  placeholder={varName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={variables[varName] || ''}
                  onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleTest}
          disabled={testMutation.isPending || result?.status === 'pending'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {result?.status === 'pending' ? 'Testing...' : 'Run Test'}
        </button>

        {testMutation.isError && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {testMutation.error.response?.data?.detail || 'Failed to start test'}
          </div>
        )}

        {result && result.status === 'success' && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Response</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{result.response}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Tokens</div>
                <div className="font-semibold">{result.tokens}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Cost</div>
                <div className="font-semibold">${result.cost.toFixed(4)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500">Latency</div>
                <div className="font-semibold">{result.latency_ms}ms</div>
              </div>
            </div>
          </div>
        )}

        {result && result.status === 'error' && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
