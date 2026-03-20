export type StaffRecord = Record<string, unknown>;
import { getRoleLabel, normalizeRoleId } from '../../utils/roleAccess';

const STAFF_ID_CANDIDATES = ['staffId', 'id', 'userId', 'districtStaffId', 'blockStaffId'];
const APPROVAL_STATE_CANDIDATES = ['approved', 'isApproved', 'approvalStatus', 'status'];
const ROLE_VALUE_CANDIDATES = ['roleName', 'RoleName', 'role', 'roleId', 'RoleId', 'userRole'];

export type ApprovalBucket = 'pending' | 'approved' | 'rejected' | 'unknown';

export const toStaffRecords = (value: unknown): StaffRecord[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is StaffRecord => typeof item === 'object' && item !== null);
  }

  if (value && typeof value === 'object') {
    const maybeData = (value as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData.filter((item): item is StaffRecord => typeof item === 'object' && item !== null);
    }
  }

  return [];
};

export const resolveStaffId = (record: StaffRecord): string | null => (record as any)[resolveStaffId.name] ?? getStaffId(record);

export const getStaffId = (record: StaffRecord): string | null => {
  for (const key of STAFF_ID_CANDIDATES) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }

  return null;
};

export const isApprovalPending = (record: StaffRecord): boolean => {
  let foundApprovalKey = false;

  for (const key of APPROVAL_STATE_CANDIDATES) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      foundApprovalKey = true;
    }

    if (typeof value === 'boolean') {
      return !value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['pending', 'submitted', 'requested', 'awaiting_approval'].includes(normalized)) {
        return true;
      }
      if (['approved', 'active'].includes(normalized)) {
        return false;
      }
    }
  }

  return !foundApprovalKey;
};

export const hasApprovalState = (record: StaffRecord): boolean =>
  APPROVAL_STATE_CANDIDATES.some((key) => record[key] !== undefined && record[key] !== null);

export const getApprovalBucket = (record: StaffRecord): ApprovalBucket => {
  let foundApprovalKey = false;

  for (const key of APPROVAL_STATE_CANDIDATES) {
    const value = record[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    foundApprovalKey = true;

    if (typeof value === 'boolean') {
      return value ? 'approved' : 'pending';
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['pending', 'submitted', 'requested', 'awaiting_approval'].includes(normalized)) {
        return 'pending';
      }
      if (['approved', 'active'].includes(normalized)) {
        return 'approved';
      }
      if (['rejected', 'declined', 'inactive'].includes(normalized)) {
        return 'rejected';
      }
    }
  }

  return foundApprovalKey ? 'unknown' : 'pending';
};

export const getStaffRoleLabel = (record: StaffRecord): string => {
  for (const key of ROLE_VALUE_CANDIDATES) {
    const value = record[key];
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }

      const normalizedRoleId = normalizeRoleId(trimmed);
      const derivedLabel = getRoleLabel(normalizedRoleId);
      if (derivedLabel !== 'USER') {
        return derivedLabel;
      }

      return trimmed;
    }

    if (typeof value === 'number') {
      const derivedLabel = getRoleLabel(normalizeRoleId(value));
      return derivedLabel !== 'USER' ? derivedLabel : String(value);
    }
  }

  return '-';
};

export const formatStaffValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};
