import api from './api';
import type { PendingStaffRecord } from '../types/common.types';

export const staffService = {
  getAllUsers: async (): Promise<PendingStaffRecord[]> => {
    const response = await api.get('/api/admin/all-users');
    return response.data;
  },

  getPendingStaff: async (): Promise<PendingStaffRecord[]> => {
    const response = await api.get('/api/admin/pending');
    return response.data;
  },

  getApprovedStaff: async (): Promise<PendingStaffRecord[]> => {
    const response = await api.get('/api/admin/approved');
    return response.data;
  },

  getRejectedStaff: async (): Promise<PendingStaffRecord[]> => {
    const response = await api.get('/api/admin/rejected');
    return response.data;
  },

  approveStaff: async (staffId: string) => {
    const response = await api.post(`/api/admin/approve/${staffId}`);
    return response.data;
  },

  rejectStaff: async (staffId: string) => {
    const response = await api.post(`/api/admin/reject/${staffId}`);
    return response.data;
  },
};
