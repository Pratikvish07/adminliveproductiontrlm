// Common TypeScript interfaces for TRLM app

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type SortOrder = 'asc' | 'desc';

export interface FilterParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export type PendingStaffRecordValue = string | number | boolean | null | undefined;

export type PendingStaffRecord = Record<string, PendingStaffRecordValue>;
export type PendingCRPRecord = Record<string, PendingStaffRecordValue>;

export interface StaffActionRequest {
  staffId: string | number;
}

