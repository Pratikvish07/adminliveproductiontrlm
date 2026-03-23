import type { CRPRecord } from '../../services/crpService';
import type { PendingCRPRecord } from '../../services/crpService';

export type CRPRecordProcessed = Record<string, string | number | undefined>;

const getNestedValue = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const objectValue = value as Record<string, unknown>;
  return (
    getNestedValue(objectValue.district) ??
    getNestedValue(objectValue.District) ??
    getNestedValue(objectValue.block) ??
    getNestedValue(objectValue.Block) ??
    getNestedValue(objectValue.districtMaster) ??
    getNestedValue(objectValue.DistrictMaster) ??
    getNestedValue(objectValue.blockMaster) ??
    getNestedValue(objectValue.BlockMaster) ??
    objectValue.districtName ??
    objectValue.DistrictName ??
    objectValue.blockName ??
    objectValue.BlockName ??
    objectValue.name ??
    objectValue.Name ??
    objectValue.label ??
    objectValue.Label ??
    objectValue.title ??
    objectValue.Title ??
    objectValue.id ??
    objectValue.Id ??
    value
  );
};

const getFirstValue = (record: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = getNestedValue(record[key]);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const findNestedValueByKeys = (
  value: unknown,
  keys: string[],
  depth = 0,
): unknown => {
  if (depth > 5 || value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findNestedValueByKeys(item, keys, depth + 1);
      if (nested !== undefined && nested !== null && nested !== '') {
        return nested;
      }
    }
    return undefined;
  }

  if (typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const directValue = record[key];
    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return getNestedValue(directValue);
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = findNestedValueByKeys(nestedValue, keys, depth + 1);
    if (nested !== undefined && nested !== null && nested !== '') {
      return nested;
    }
  }

  return undefined;
};

const normalizeText = (value: unknown, fallback = 'N/A'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value);
};

const resolveDistrictValue = (record: Record<string, unknown>): string => {
  const directValue = getFirstValue(record, [
    'districtName',
    'DistrictName',
    'district',
    'District',
    'districtMaster',
    'DistrictMaster',
    'districtData',
    'DistrictData',
  ]);

  if (directValue !== undefined && directValue !== null && directValue !== '') {
    return normalizeText(directValue);
  }

  return normalizeText(
    findNestedValueByKeys(record, [
      'districtName',
      'DistrictName',
      'name',
      'Name',
      'label',
      'Label',
      'title',
      'Title',
    ]),
  );
};

const resolveBlockValue = (record: Record<string, unknown>): string => {
  const directValue = getFirstValue(record, [
    'blockName',
    'BlockName',
    'block',
    'Block',
    'blockMaster',
    'BlockMaster',
    'blockData',
    'BlockData',
  ]);

  if (directValue !== undefined && directValue !== null && directValue !== '') {
    return normalizeText(directValue);
  }

  return normalizeText(
    findNestedValueByKeys(record, [
      'blockName',
      'BlockName',
      'name',
      'Name',
      'label',
      'Label',
      'title',
      'Title',
    ]),
  );
};

const normalizeStatus = (record: Record<string, unknown>): string => {
  const statusValue = getFirstValue(record, ['status', 'Status', 'approvalStatus', 'ApprovalStatus']);
  if (typeof statusValue === 'string' && statusValue.trim()) {
    const normalized = statusValue.trim().toLowerCase();
    if (normalized === '1') {
      return 'Approved';
    }
    if (normalized === '2' || normalized === '-1') {
      return 'Rejected';
    }
    if (normalized === '0') {
      return 'Pending';
    }
    if (['approved', 'active'].includes(normalized)) {
      return 'Approved';
    }
    if (['rejected', 'declined', 'inactive'].includes(normalized)) {
      return 'Rejected';
    }
    if (['pending', 'submitted', 'requested', 'awaiting_approval', 'awaiting approval', 'new'].includes(normalized)) {
      return 'Pending';
    }

    return statusValue.trim();
  }

  if (typeof statusValue === 'number') {
    if (statusValue === 1) {
      return 'Approved';
    }
    if (statusValue === 2 || statusValue === -1) {
      return 'Rejected';
    }
    if (statusValue === 0) {
      return 'Pending';
    }
    return 'Pending';
  }

  const approvedValue = getFirstValue(record, ['approved', 'Approved', 'isApproved', 'IsApproved']);
  if (typeof approvedValue === 'boolean') {
    return approvedValue ? 'Approved' : 'Pending';
  }

  return 'Pending';
};

export function toCRPRecords(records: CRPRecord[] | PendingCRPRecord[]): CRPRecordProcessed[] {
  return records.map((record) => ({
    ...record as any,
    name: normalizeText(getFirstValue(record, ['name', 'Name', 'officialName', 'OfficialName', 'fullName', 'FullName'])),
    district: resolveDistrictValue(record),
    block: resolveBlockValue(record),
    status: normalizeStatus(record),
  }));
}

export function getCRPid(record: CRPRecordProcessed): string {
  return String((record as any).crpRegistrationId || (record as any).id || '');
}

export function formatCRPValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
