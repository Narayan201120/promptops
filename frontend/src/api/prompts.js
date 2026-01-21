import apiClient from './client';
import apiKeyManager from '../utils/apiKeyManager';

export const promptsAPI = {
  list: (params) => apiClient.get('/prompts/', { params }),
  get: (id) => apiClient.get(`/prompts/${id}/`),
  create: (data) => apiClient.post('/prompts/', data),
  update: (id, data) => apiClient.patch(`/prompts/${id}/`, data),
  delete: (id) => apiClient.delete(`/prompts/${id}/`),
  getVersions: (id) => apiClient.get(`/prompts/${id}/versions/`),
  revert: (id, versionId) => apiClient.post(`/prompts/${id}/revert/`, { version_id: versionId }),
  test: (id, data) => {
    // Get API key from localStorage for the provider
    const provider = data.provider;
    const apiKey = apiKeyManager.getKey(provider);

    // Send API key in headers
    return apiClient.post(`/prompts/${id}/test/`, data, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {}
    });
  },
  reindex: (id) => apiClient.post(`/prompts/${id}/reindex/`),
  runBenchmark: (id, data) => apiClient.post(`/prompts/${id}/run_benchmark/`, data),
  getBenchmarks: (id) => apiClient.get(`/benchmarks/`, { params: { prompt: id } }),
  getBenchmark: (id) => apiClient.get(`/benchmarks/${id}/`),
  runBatch: (id, data) => apiClient.post(`/prompts/${id}/run_batch/`, data),
  getBatchRun: (id) => apiClient.get(`/test-runs/`, { params: { batch_run: id } }),
  pushToGithub: (id, data) => apiClient.post(`/prompts/${id}/push_to_github/`, data),
};
