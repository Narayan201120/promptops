import apiClient from './client';

export const promptsAPI = {
  list: (params) => apiClient.get('/prompts/', { params }),
  get: (id) => apiClient.get(`/prompts/${id}/`),
  create: (data) => apiClient.post('/prompts/', data),
  update: (id, data) => apiClient.patch(`/prompts/${id}/`, data),
  delete: (id) => apiClient.delete(`/prompts/${id}/`),
  getVersions: (id) => apiClient.get(`/prompts/${id}/versions/`),
  revert: (id, versionId) => apiClient.post(`/prompts/${id}/revert/`, { version_id: versionId }),
  test: (id, data) => apiClient.post(`/prompts/${id}/test/`, data),
};
