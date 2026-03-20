import type { User } from '../types/auth.types';

export const ROLE_IDS = {
  STATE_ADMIN: '1',
  DISTRICT_STAFF: '2',
  BLOCK_STAFF: '3',
} as const;

export type RoleId = typeof ROLE_IDS[keyof typeof ROLE_IDS];

export const normalizeRoleId = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return '';
  }

  const normalizedText = rawValue.toUpperCase().replace(/[\s-]+/g, '_');
  if (normalizedText === 'STATE_ADMIN') {
    return ROLE_IDS.STATE_ADMIN;
  }
  if (normalizedText === 'DISTRICT_STAFF') {
    return ROLE_IDS.DISTRICT_STAFF;
  }
  if (normalizedText === 'BLOCK_STAFF') {
    return ROLE_IDS.BLOCK_STAFF;
  }

  const parsedNumber = Number.parseInt(rawValue, 10);
  if (!Number.isNaN(parsedNumber)) {
    return String(parsedNumber);
  }

  return rawValue;
};

export const getUserRoleId = (user: User | null): string => {
  if (!user) {
    return '';
  }

  return normalizeRoleId(user.role || user.roleId);
};

export const getRoleLabel = (roleId: string): string => {
  switch (normalizeRoleId(roleId)) {
    case ROLE_IDS.STATE_ADMIN:
      return 'STATE_ADMIN';
    case ROLE_IDS.DISTRICT_STAFF:
      return 'DISTRICT_STAFF';
    case ROLE_IDS.BLOCK_STAFF:
      return 'BLOCK_STAFF';
    default:
      return 'USER';
  }
};

export const isStateAdmin = (user: User | null): boolean => getUserRoleId(user) === ROLE_IDS.STATE_ADMIN;
export const isDistrictStaff = (user: User | null): boolean => getUserRoleId(user) === ROLE_IDS.DISTRICT_STAFF;
export const isBlockStaff = (user: User | null): boolean => getUserRoleId(user) === ROLE_IDS.BLOCK_STAFF;

export const canAccessRoles = (user: User | null, allowedRoles?: string[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const roleId = getUserRoleId(user);
  return allowedRoles.includes(roleId);
};

const normalizeScopeValue = (value: unknown): string => String(value ?? '').trim().toLowerCase();

export const filterByDistrictAndBlock = <T extends Record<string, unknown>>(
  items: T[],
  user: User | null,
  districtKeys: string[] = ['districtId', 'district', 'districtName'],
  blockKeys: string[] = ['blockId', 'block', 'blockName'],
): T[] => {
  if (isStateAdmin(user)) {
    return items;
  }

  if (isDistrictStaff(user)) {
    const districtId = user?.districtId;
    const districtName = user?.districtName;
    return items.filter((item) =>
      districtKeys.some((key) => {
        const value = item[key];
        const normalizedValue = normalizeScopeValue(value);
        return normalizedValue === normalizeScopeValue(districtId) || normalizedValue === normalizeScopeValue(districtName);
      }),
    );
  }

  if (isBlockStaff(user)) {
    const blockId = user?.blockId;
    const blockName = user?.blockName;
    return items.filter((item) =>
      blockKeys.some((key) => {
        const value = item[key];
        const normalizedValue = normalizeScopeValue(value);
        return normalizedValue === normalizeScopeValue(blockId) || normalizedValue === normalizeScopeValue(blockName);
      }),
    );
  }

  return items;
};
