import api from './api';
import { getWithFallback } from './requestFallback';

export type CRPRecord = Record<string, unknown>;
export type PendingCRPRecord = Record<string, unknown>;

const toOptionalInt = (value: string | number | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const isBadRequestError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status === 400
    : false;
};

const postCRPDecision = async (path: string, approvedBy?: string) => {
  const approverId = toOptionalInt(approvedBy);

  try {
    const response = await api.post(path, null, approverId === undefined ? undefined : {
      params: {
        approvedBy: approverId,
      },
    });
    return response.data;
  } catch (error) {
    if (!isBadRequestError(error) || approverId === undefined) {
      throw error;
    }

    const fallbackResponse = await api.post(path);
    return fallbackResponse.data;
  }
};

export const crpService = {
  getCRPList: async (): Promise<CRPRecord[]> => {
    return getWithFallback<CRPRecord[]>([
      '/auth/crp/all',
      '/crp/all',
    ]);
  },

  getCRPByDistrict: async (districtId: string): Promise<CRPRecord[]> => {
    const response = await api.get<CRPRecord[]>(`/auth/crp/district/${districtId}`);
    return response.data;
  },

  getCRPByBlock: async (blockId: string): Promise<CRPRecord[]> => {
    const response = await api.get<CRPRecord[]>(`/auth/crp/block/${blockId}`);
    return response.data;
  },

  getPendingCRP: async (): Promise<PendingCRPRecord[]> => {
    return getWithFallback<PendingCRPRecord[]>([
      '/auth/crp/pending',
      '/crp/pending',
    ]);
  },

  getCRPTracking: async (crpId: string) => {
    const response = await api.get(`/crp/${crpId}/tracking`);
    return response.data;
  },

  approveCRP: async (crpId: string, approvedBy?: string) => {
    return postCRPDecision(`/auth/crp/approve/${crpId}`, approvedBy);
  },

  rejectCRP: async (crpId: string, approvedBy?: string) => {
    return postCRPDecision(`/auth/crp/reject/${crpId}`, approvedBy);
  },
};
