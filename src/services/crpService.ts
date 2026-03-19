import api from './api';
import { useAuth } from '../context/AuthContext'; // Temp note: hooks not in services; pass approvedBy from component

export type CRPRecord = Record<string, unknown>;
export type PendingCRPRecord = Record<string, unknown>;

export const crpService = {
  getCRPList: async (): Promise<CRPRecord[]> => {
    const response = await api.get('/api/api/auth/crp/all');
    return response.data;
  },

  getPendingCRP: async (): Promise<PendingCRPRecord[]> => {
    const response = await api.get('/api/auth/crp/pending');
    return response.data;
  },

  getCRPTracking: async (crpId: string) => {
    const response = await api.get(`/api/api/crp/${crpId}/tracking`);
    return response.data;
  },

  approveCRP: async (crpId: string, approvedBy: string) => {
    const response = await api.post(`/api/auth/crp/approve/${crpId}?approvedBy=${approvedBy}`);
    return response.data;
  },

  rejectCRP: async (crpId: string) => {
    const response = await api.post(`/api/auth/crp/reject/${crpId}`);
    return response.data;
  },
};
