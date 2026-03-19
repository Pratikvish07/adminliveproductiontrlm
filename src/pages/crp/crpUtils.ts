import type { CRPRecord } from '../../services/crpService';
import type { PendingCRPRecord } from '../../types/common.types';

export type CRPRecordProcessed = Record<string, string | number>;

export function toCRPRecords(records: CRPRecord[] | PendingCRPRecord[]): CRPRecordProcessed[] {
  return records.map(record => ({
    id: record.crpRegistrationId || record.id || 'N/A',
    name: record.name || record.officialName || 'N/A',
    district: record.districtName || 'N/A',
    block: record.blockName || 'N/A',
    status: record.status || 'Pending',
    ...record as any
  }));
}

export function getCRPid(record: CRPRecordProcessed): string {
  return record.id as string;
}

export function formatCRPValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
