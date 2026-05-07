import api from './api';
import { getWithFallback } from './requestFallback';

export type CRPRecord = Record<string, unknown>;
export type PendingCRPRecord = Record<string, unknown>;
export type SHGMemberRecord = Record<string, unknown>;
export type CreateCRPPayload = {
  fullName: string;
  aadhaarNo: string;
  lokOSId: string;
  villageId: number;
  blockId: number;
  contactNo: string;
  emailId: string;
  password: string;
  crpTypeId: number;
  shgId: number;
  picturePath: string;
  latitude: number;
  longitude: number;
};

type SHGMembersByVillageResponse = {
  status?: boolean;
  message?: string;
  data?: SHGMemberRecord[];
};

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

const isNotFoundError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status === 404
    : false;
};

const postCRPDecision = async (paths: string[], approvedBy?: string) => {
  const approverId = toOptionalInt(approvedBy);
  const normalizedPaths = Array.from(new Set(paths));
  let lastError: unknown = null;

  const requestVariants = approverId === undefined
    ? [
        { data: null, config: undefined },
      ]
    : [
        { data: null, config: { params: { approvedBy: approverId } } },
        { data: { approvedBy: approverId }, config: undefined },
        { data: null, config: undefined },
      ];

  for (const path of normalizedPaths) {
    for (const variant of requestVariants) {
      try {
        const response = await api.post(path, variant.data, variant.config);
        return response.data;
      } catch (error) {
        lastError = error;

        // Retry the same path with a different request shape when the server rejects the payload.
        if (isBadRequestError(error)) {
          continue;
        }

        // Try the next path when the backend exposes a different CRP approval route.
        if (isNotFoundError(error)) {
          break;
        }

        throw error;
      }
    }
  }

  throw lastError;
};

export const crpService = {
  /**
   * Fetch all CRP records. Tries authenticated route first, falls back to open route.
   */
  getCRPList: async (): Promise<CRPRecord[]> => {
    return getWithFallback<CRPRecord[]>([
      '/auth/crp/all',
      '/crp/all',
    ]);
  },

  /**
   * Fetch CRP records scoped to a district.
   * Falls back to full list filtered client-side if district endpoint fails.
   */
  getCRPByDistrict: async (districtId: string): Promise<CRPRecord[]> => {
    try {
      const response = await api.get<CRPRecord[]>(`/auth/crp/district/${districtId}`);
      return response.data;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      // If district endpoint doesn't exist yet, fall back to full list
      if (status === 404 || (status !== undefined && status >= 500)) {
        console.warn(`[crpService] District endpoint failed (${status}), falling back to full list`);
        return getWithFallback<CRPRecord[]>([
          '/auth/crp/all',
          '/crp/all',
        ]);
      }
      throw error;
    }
  },

  /**
   * Fetch CRP records scoped to a block.
   * Falls back to full list if block endpoint fails.
   */
  getCRPByBlock: async (blockId: string): Promise<CRPRecord[]> => {
    try {
      const response = await api.get<CRPRecord[]>(`/auth/crp/block/${blockId}`);
      return response.data;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404 || (status !== undefined && status >= 500)) {
        console.warn(`[crpService] Block endpoint failed (${status}), falling back to full list`);
        return getWithFallback<CRPRecord[]>([
          '/auth/crp/all',
          '/crp/all',
        ]);
      }
      throw error;
    }
  },

  /**
   * Fetch only pending CRP records.
   */
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

  getSHGMembersByVillage: async (villageId: string): Promise<SHGMemberRecord[]> => {
    const response = await api.get<SHGMembersByVillageResponse>(
      `/SHGUpload/members-by-village/${villageId}`,
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  createCRP: async (payload: CreateCRPPayload) => {
    const response = await api.post('/auth/crp/signup', payload);
    return response.data;
  },

  approveCRP: async (crpId: string, approvedBy?: string) => {
    return postCRPDecision([
      `/auth/crp/approve/${crpId}`,
      `/crp/approve/${crpId}`,
    ], approvedBy);
  },

  rejectCRP: async (crpId: string, approvedBy?: string) => {
    return postCRPDecision([
      `/auth/crp/reject/${crpId}`,
      `/crp/reject/${crpId}`,
    ], approvedBy);
  },
};
