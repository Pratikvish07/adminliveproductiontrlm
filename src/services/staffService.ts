import type { PendingStaffRecord } from '../types/common.types';
import { getWithFallback } from './requestFallback';
import api from './api';

type StaffService = {
  getAllUsers: () => Promise<PendingStaffRecord[]>;
  getPendingStaff: () => Promise<PendingStaffRecord[]>;
  getApprovedStaff: () => Promise<PendingStaffRecord[]>;
  getRejectedStaff: () => Promise<PendingStaffRecord[]>;
  approveStaff: (staffId: string) => Promise<unknown>;
  rejectStaff: (staffId: string) => Promise<unknown>;
};

export const staffService: StaffService = {
  getAllUsers: async (): Promise<PendingStaffRecord[]> => {
    return getWithFallback<PendingStaffRecord[]>([
      '/admin/all-users',
      '/admin/staff/all-users',
    ]);
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
