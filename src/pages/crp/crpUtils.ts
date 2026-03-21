import type { CRPRecord } from '../../services/crpService';
import type { PendingCRPRecord } from '../../services/crpService';

export type CRPRecordProcessed = Record<string, string | number>;

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

const normalizeText = (value: unknown, fallback = 'N/A'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return String(value);
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
    id: normalizeText(getFirstValue(record, ['id', 'Id', 'crpRegistrationId', 'CrpRegistrationId']), '-'),
    name: normalizeText(getFirstValue(record, ['name', 'Name', 'officialName', 'OfficialName', 'fullName', 'FullName'])),
    district: normalizeText(
      getFirstValue(record, [
        'district',
        'District',
        'districtName',
        'DistrictName',
        'districtMaster',
        'DistrictMaster',
        'districtData',
        'DistrictData',
        'districtId',
        'DistrictId',
      ]),
    ),
    block: normalizeText(
      getFirstValue(record, [
        'block',
        'Block',
        'blockName',
        'BlockName',
        'blockMaster',
        'BlockMaster',
        'blockData',
        'BlockData',
        'blockId',
        'BlockId',
      ]),
    ),
    status: normalizeStatus(record),
    crpRegistrationId: normalizeText(getFirstValue(record, ['crpRegistrationId', 'CrpRegistrationId', 'id', 'Id']), '-'),
    crpId: normalizeText(getFirstValue(record, ['crpId', 'CrpId', 'lokOSId', 'LokOSId']), '-'),
    fullName: normalizeText(getFirstValue(record, ['fullName', 'FullName', 'name', 'Name', 'officialName', 'OfficialName'])),
    aadhaarNo: normalizeText(getFirstValue(record, ['aadhaarNo', 'AadhaarNo']), '-'),
  }));
}

export function getCRPid(record: CRPRecordProcessed): string {
  return String(record.crpRegistrationId || record.id || '');
}

export function formatCRPValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
