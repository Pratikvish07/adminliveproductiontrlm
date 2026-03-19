import api from './api';
import type { SignupRequest } from '../types/auth.types';

export const authService = {
  login: async (data: {
    livelihoodTrackerId: string;
    password: string;
  }) => {
    const res = await api.post('/api/admin/login', data);
    return res.data;
  },

  signup: async (data: SignupRequest) => {
    const res = await api.post('/api/admin/signup', data);
    return res.data;
  },
};
