import api from './api';
import type { LandType } from '../types/master.types';

// ── Land Type (Master Data module) ──────────────────────────────────────────
// Live backend (swagger):
//   POST   /Land-type/save        → create/update (?id=&name= query params;
//                                   id omitted → create, id present → update)
//   GET    /Land-type/get-all     → list
//   GET    /Land-type/get/{id}    → by id (int32)
//   DELETE /Land-type/delete/{id} → delete (int32)
//   GET    /Land-type/search      → ?text= (query string)
//
// ⚠ BACKEND BUG (verified live 2026-08-26): every endpoint currently returns
//   500 "Could not find stored procedure 'sp_LandType_CRUD'".
//   The DBA/backend team must create that stored procedure; the frontend
//   contract below is complete and will work as soon as it exists.

const mapRecord = (item: any): LandType => ({
  LandTypeId: Number(item.LandTypeId ?? item.LandTypeID ?? item.Id ?? item.id ?? 0),
  LandTypeName: String(item.LandTypeName ?? item.LandTYPEName ?? item.Name ?? item.name ?? ''),
});

const rawList = (payload: unknown): any[] =>
  Array.isArray(payload) ? payload : ((payload as { data?: any[] })?.data ?? []);

export const getErrDetail = (err: unknown): string => {
  const e = err as { response?: { data?: { detail?: string; message?: string } } };
  return e?.response?.data?.detail || e?.response?.data?.message || '';
};

export const getLandTypes = async (): Promise<LandType[]> => {
  const response = await api.get('/Land-type/get-all');
  return rawList(response.data).map(mapRecord);
};

export const getLandTypeById = async (id: number): Promise<LandType> => {
  const response = await api.get(`/Land-type/get/${id}`);
  return mapRecord(response.data);
};

export const saveLandType = async (id: number | null, name: string): Promise<void> => {
  // POST /Land-type/save?id=&name= — query params per swagger
  await api.post('/Land-type/save', null, {
    params: id !== null ? { id, name } : { name },
  });
};

export const deleteLandType = async (id: number): Promise<void> => {
  await api.delete(`/Land-type/delete/${id}`);
};

/**
 * Server-side search (GET /Land-type/search?text=…).
 * Falls back to client-side filtering in the page when this fails.
 */
export const searchLandTypes = async (text: string): Promise<LandType[]> => {
  const response = await api.get('/Land-type/search', { params: { text } });
  return rawList(response.data).map(mapRecord);
};

export const landTypeService = {
  getLandTypes,
  getLandTypeById,
  saveLandType,
  deleteLandType,
  searchLandTypes,
};