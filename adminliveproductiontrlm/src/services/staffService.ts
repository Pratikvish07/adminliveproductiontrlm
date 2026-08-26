import type { PendingStaffRecord } from '../types/common.types';
import api from './api';
import { getWithFallback } from './requestFallback';

type StaffService = {
  getAllUsers: () => Promise<PendingStaffRecord[]>;
  getPendingStaff: () => Promise<PendingStaffRecord[]>;
  getApprovedStaff: () => Promise<PendingStaffRecord[]>;
  getRejectedStaff: () => Promise<PendingStaffRecord[]>;
  updateUser: (payload: Record<string, unknown>) => Promise<unknown>;
  approveStaff: (staffId: string) => Promise<unknown>;
  rejectStaff: (staffId: string) => Promise<unknown>;
};

const getStaffList = async (paths: string[]): Promise<PendingStaffRecord[]> => {
  return getWithFallback<PendingStaffRecord[]>(paths);
};

const mergeStaffLists = (lists: PendingStaffRecord[][]): PendingStaffRecord[] => {
  const merged: PendingStaffRecord[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    for (const record of list) {
      const id = String(
        record.staffId ??
        record.id ??
        record.userId ??
        record.districtStaffId ??
        record.blockStaffId ??
        '',
      ).trim();

      const fallbackKey = JSON.stringify(record);
      const dedupeKey = id || fallbackKey;
      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      merged.push(record);
    }
  }

  return merged;
};

export const staffService: StaffService = {
  getAllUsers: async (): Promise<PendingStaffRecord[]> => {
    try {
      return await getStaffList([
        '/admin/all-users',
        '/admin/staff/all-users',
      ]);
    } catch (allUsersError) {
      const [pending, approved, rejected] = await Promise.allSettled([
        getStaffList(['/admin/pending', '/admin/staff/pending']),
        getStaffList(['/admin/approved', '/admin/staff/approved']),
        getStaffList(['/admin/rejected', '/admin/staff/rejected']),
      ]);

      const recoveredLists = [pending, approved, rejected]
        .filter((result): result is PromiseFulfilledResult<PendingStaffRecord[]> => result.status === 'fulfilled')
        .map((result) => result.value);

      if (recoveredLists.length > 0) {
        return mergeStaffLists(recoveredLists);
      }

      throw allUsersError;
    }
  },

  getPendingStaff: async (): Promise<PendingStaffRecord[]> => {
    return getStaffList([
      '/admin/pending',
      '/admin/staff/pending',
    ]);
  },

  getApprovedStaff: async (): Promise<PendingStaffRecord[]> => {
    return getStaffList([
      '/admin/approved',
      '/admin/staff/approved',
    ]);
  },

  getRejectedStaff: async (): Promise<PendingStaffRecord[]> => {
    return getStaffList([
      '/admin/rejected',
      '/admin/staff/rejected',
    ]);
  },

  updateUser: async (payload: Record<string, unknown>) => {
    const response = await api.put('/admin/update-user', payload);
    return response.data;
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
