import apiClient from './client';

export const analyticsAPI = {
  getSummary: () => apiClient.get('/analytics/summary/'),
  getTrends: (days = 30) => apiClient.get('/analytics/trends/', { params: { days } }),
  getTopPrompts: () => apiClient.get('/analytics/top-prompts/'),
};
