import apiClient from './client';

export const datasetsAPI = {
    list: (params) => apiClient.get('/datasets/', { params }),
    get: (id) => apiClient.get(`/datasets/${id}/`),
    create: (data) => apiClient.post('/datasets/', data),
    delete: (id) => apiClient.delete(`/datasets/${id}/`),
};
