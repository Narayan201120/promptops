import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register/', data),
  login: (data) => apiClient.post('/auth/login/', data),
  getProfile: () => apiClient.get('/auth/profile/'),
  updateProfile: (data) => apiClient.patch('/auth/profile/', data),
};
