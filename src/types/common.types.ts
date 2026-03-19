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

export type PendingStaffRecord = Record<string, unknown>;

export interface StaffActionRequest {
  staffId: string | number;
}

