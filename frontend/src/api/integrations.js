import apiClient from './client';

export const integrationsAPI = {
    github: {
        list: () => apiClient.get('/integrations/github/'),
        create: (data) => apiClient.post('/integrations/github/', data),
        update: (id, data) => apiClient.patch(`/integrations/github/${id}/`, data),
        delete: (id) => apiClient.delete(`/integrations/github/${id}/`),
    },
};
