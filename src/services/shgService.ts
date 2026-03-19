import api from './api';

export const shgService = {
  getSHGList: async () => {
    const response = await api.get('/api/shg/list');
    return response.data;
  },

  getSHGDetails: async (id: string) => {
    const response = await api.get(`/api/shg/${id}`);
    return response.data;
  },
};

