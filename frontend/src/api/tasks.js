import apiClient from './client';

export const tasksAPI = {
  getStatus: (taskId) => apiClient.get(`/tasks/${taskId}/`),
};
