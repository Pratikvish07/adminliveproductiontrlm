import api from './api';
import type { IncomeProfile } from '../types/master.types';

// ── Income Profile (Administration module) ─────────────────────────────────
// Live backend (swagger):
//   POST   /income-profile/save        → create/update (JSON IncomeProfileRequest,
//                                        incomeProfileId nullable → null = create)
//   GET    /income-profile/get-all     → list
//   GET    /income-profile/get/{id}    → by id (int32)
//   DELETE /income-profile/delete/{id} → delete (int32)
//   GET    /income-profile/search      → ?text= (query string)

export type IncomeProfileRequest = {
  incomeProfileId: number | null;
  activityProfileId: number;
  totalIncomeLastYear: number;
  presentMonthIncome: number;
  futureProjection: number;
  month1Income: number;
  month2Income: number;
  month3Income: number;
  month4Income: number;
  month5Income: number;
  month6Income: number;
};

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRecord = (item: any): IncomeProfile => ({
  IncomeProfileId: num(item.IncomeProfileId ?? item.incomeProfileId ?? item.id ?? item.Id),
  ActivityProfileId: num(item.ActivityProfileId ?? item.activityProfileId),
  TotalIncomeLastYear: num(item.TotalIncomeLastYear ?? item.totalIncomeLastYear),
  PresentMonthIncome: num(item.PresentMonthIncome ?? item.presentMonthIncome),
  FutureProjection: num(item.FutureProjection ?? item.futureProjection),
  Month1Income: num(item.Month1Income ?? item.month1Income),
  Month2Income: num(item.Month2Income ?? item.month2Income),
  Month3Income: num(item.Month3Income ?? item.month3Income),
  Month4Income: num(item.Month4Income ?? item.month4Income),
  Month5Income: num(item.Month5Income ?? item.month5Income),
  Month6Income: num(item.Month6Income ?? item.month6Income),
  CreatedDate: String(item.CreatedDate ?? item.createdDate ?? ''),
});

const rawList = (payload: unknown): any[] =>
  Array.isArray(payload) ? payload : ((payload as { data?: any[] })?.data ?? []);

export const getIncomeProfiles = async (): Promise<IncomeProfile[]> => {
  const response = await api.get('/income-profile/get-all');
  return rawList(response.data).map(mapRecord);
};

export const getIncomeProfileById = async (id: number): Promise<IncomeProfile> => {
  // GET /income-profile/get/{id}
  const response = await api.get(`/income-profile/get/${id}`);
  return mapRecord(response.data);
};

export const saveIncomeProfile = async (data: IncomeProfileRequest): Promise<void> => {
  // POST /income-profile/save — JSON body; incomeProfileId null → create
  await api.post('/income-profile/save', {
    incomeProfileId: data.incomeProfileId,
    activityProfileId: data.activityProfileId,
    totalIncomeLastYear: data.totalIncomeLastYear,
    presentMonthIncome: data.presentMonthIncome,
    futureProjection: data.futureProjection,
    month1Income: data.month1Income,
    month2Income: data.month2Income,
    month3Income: data.month3Income,
    month4Income: data.month4Income,
    month5Income: data.month5Income,
    month6Income: data.month6Income,
  });
};

export const deleteIncomeProfile = async (id: number): Promise<void> => {
  // DELETE /income-profile/delete/{id}
  await api.delete(`/income-profile/delete/${id}`);
};

/**
 * Server-side search (GET /income-profile/search?text=…).
 * Falls back to client-side filtering in the page when this fails.
 */
export const searchIncomeProfiles = async (text: string): Promise<IncomeProfile[]> => {
  const response = await api.get('/income-profile/search', { params: { text } });
  return rawList(response.data).map(mapRecord);
};

export const incomeProfileService = {
  getIncomeProfiles,
  getIncomeProfileById,
  saveIncomeProfile,
  deleteIncomeProfile,
  searchIncomeProfiles,
};