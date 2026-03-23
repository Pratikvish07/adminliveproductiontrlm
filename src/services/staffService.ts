import api from './api';
import type { PendingStaffRecord } from '../types/common.types';
import { getWithFallback } from './requestFallback';

type StaffService = {
  getAllUsers: () => Promise<PendingStaffRecord[]>;
  getPendingStaff: () => Promise<PendingStaffRecord[]>;
  getApprovedStaff: () => Promise<PendingStaffRecord[]>;
  getRejectedStaff: () => Promise<PendingStaffRecord[]>;
  approveStaff: (staffId: string) => Promise<unknown>;
  rejectStaff: (staffId: string) => Promise<unknown>;
};

const ALL_USERS_API_URL = 'https://trlm.pickitover.com/api/api/admin/all-users';

export const staffService: StaffService = {
  getAllUsers: async (): Promise<PendingStaffRecord[]> => {
    const response = await api.get<PendingStaffRecord[]>(ALL_USERS_API_URL);
    return response.data;
  },

  getPendingStaff: async (): Promise<PendingStaffRecord[]> => {
    return getWithFallback<PendingStaffRecord[]>([
      '/admin/pending',
      '/admin/staff/pending',
    ]);
  },

  getApprovedStaff: async (): Promise<PendingStaffRecord[]> => {
    return getWithFallback<PendingStaffRecord[]>([
      '/admin/approved',
      '/admin/staff/approved',
    ]);
  },

  getRejectedStaff: async (): Promise<PendingStaffRecord[]> => {
    return getWithFallback<PendingStaffRecord[]>([
      '/admin/rejected',
      '/admin/staff/rejected',
    ]);
  },

  approveStaff: async (staffId: string) => {
    const response = await api.post(`/admin/approve/${staffId}`);
    return response.data;
  },

  rejectStaff: async (staffId: string) => {
    const response = await api.post(`/admin/reject/${staffId}`);
    return response.data;
  },
};
