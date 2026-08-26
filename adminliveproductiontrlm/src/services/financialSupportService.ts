import api from './api';
import type { FinancialSupport, LoanProjection } from '../types/master.types';

// ── Financial Support (Administration module) ─────────────────────────────
// Live backend (swagger):
//   POST   /financial-support/insert            → create  (JSON FinancialSupportRequest)
//   PUT    /financial-support/update            → update  (JSON FinancialSupportRequest)
//   POST   /financial-support/search            → search  (JSON string body)  [server currently 500s → client fallback]
//   GET    /financial-support/get-all           → list
//   GET    /financial-support/get/{id}          → by id
//   DELETE /financial-support/delete/{id}       → delete
//   GET    /financial-support/loan-projection   → ?activityId=&loanCycleId=

export type FinancialSupportRequest = {
  financialSupportId?: number;
  shgMemberId: number;
  activityId: number;
  isFinancialSupportRequired: boolean;
  loanCycleId?: number | null;
};

const mapRecord = (item: any): FinancialSupport => ({
  FinancialSupportId: Number(item.FinancialSupportId ?? item.financialSupportId ?? item.id ?? item.Id ?? 0),
  SHGMemberId: Number(item.SHGMemberId ?? item.shgMemberId ?? 0),
  ActivityId: Number(item.ActivityId ?? item.activityId ?? 0),
  IsFinancialSupportRequired: Boolean(item.IsFinancialSupportRequired ?? item.isFinancialSupportRequired ?? false),
  LoanCycleId: item.LoanCycleId ?? item.loanCycleId ?? null,
  CreatedDate: String(item.CreatedDate ?? item.createdDate ?? ''),
  ActivityName: String(item.ActivityName ?? item.activityName ?? '-'),
  CycleName: item.CycleName ?? item.cycleName ?? null,
});

const rawList = (payload: unknown): any[] =>
  Array.isArray(payload) ? payload : ((payload as { data?: any[] })?.data ?? []);

export const getFinancialSupports = async (): Promise<FinancialSupport[]> => {
  const response = await api.get('/financial-support/get-all');
  return rawList(response.data).map(mapRecord);
};

export const getFinancialSupportById = async (id: number): Promise<FinancialSupport> => {
  // GET /financial-support/get/{id}
  const response = await api.get(`/financial-support/get/${id}`);
  return mapRecord(response.data);
};

export const insertFinancialSupport = async (data: FinancialSupportRequest): Promise<void> => {
  // POST /financial-support/insert — JSON body
  await api.post('/financial-support/insert', {
    financialSupportId: data.financialSupportId ?? 0,
    shgMemberId: data.shgMemberId,
    activityId: data.activityId,
    isFinancialSupportRequired: data.isFinancialSupportRequired,
    loanCycleId: data.loanCycleId ?? 0,
  });
};

export const updateFinancialSupport = async (data: FinancialSupportRequest): Promise<void> => {
  // PUT /financial-support/update — JSON body
  await api.put('/financial-support/update', {
    financialSupportId: data.financialSupportId ?? 0,
    shgMemberId: data.shgMemberId,
    activityId: data.activityId,
    isFinancialSupportRequired: data.isFinancialSupportRequired,
    loanCycleId: data.loanCycleId ?? 0,
  });
};

export const deleteFinancialSupport = async (id: number): Promise<void> => {
  // DELETE /financial-support/delete/{id} → { Message: "Deleted Sucessfully" }
  await api.delete(`/financial-support/delete/${id}`);
};

/**
 * Server-side search (POST with a JSON string body per swagger).
 * NOTE: the production endpoint currently returns 500 for valid bodies,
 * so callers should fall back to client-side filtering on failure.
 */
export const searchFinancialSupports = async (text: string): Promise<FinancialSupport[]> => {
  const response = await api.post('/financial-support/search', JSON.stringify(text), {
    headers: { 'Content-Type': 'application/json' },
  });
  return rawList(response.data).map(mapRecord);
};

export const getLoanProjection = async (
  activityId: number,
  loanCycleId: number,
): Promise<LoanProjection> => {
  // GET /financial-support/loan-projection?activityId=…&loanCycleId=…
  const response = await api.get<LoanProjection>('/financial-support/loan-projection', {
    params: { activityId, loanCycleId },
  });
  return response.data;
};

export const financialSupportService = {
  getFinancialSupports,
  getFinancialSupportById,
  insertFinancialSupport,
  updateFinancialSupport,
  deleteFinancialSupport,
  searchFinancialSupports,
  getLoanProjection,
};