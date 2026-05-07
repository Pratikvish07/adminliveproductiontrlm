import type { User } from '../types/auth.types';

export const ROLE_IDS = {
  STATE_ADMIN: '1',
  DISTRICT_STAFF: '2',
  BLOCK_STAFF: '3',
} as const;

/**
 * Normalize role ID — if numeric string, return as-is; if name, look up ID.
 */
export const normalizeRoleId = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return '';
  }

  // If already numeric (e.g. 1, 2, 3) just return as string
  const parsedNumber = Number.parseInt(rawValue, 10);
  if (!Number.isNaN(parsedNumber)) {
    return String(parsedNumber);
  }

  // Convert role name → role ID via cached roles
  return getRoleIdByName(rawValue);
};

/**
 * Get logged in user role ID
 */
export const getUserRoleId = (user: User | null): string => {
  if (!user) {
    return '';
  }

  // Check roleId then role
  const val = user.roleId || user.role;
  return normalizeRoleId(val);
};

const BASE_API_URL = import.meta.env.VITE_API_URL;

export interface Role {
  id: string;
  name: string;
}

let cachedRoles: Role[] = [];

/**
 * Fetch roles from API and cache them.
 * API returns: [{ roleId, roleName, createdDate }, ...]
 */
export const fetchRoles = async (): Promise<Role[]> => {
  try {
    const response = await fetch(`${BASE_API_URL}/Role`);

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    const data = await response.json();

    cachedRoles = (data?.data || data || []).map((role: any) => ({
      // API uses roleId / roleName fields
      id: String(role.roleId ?? role.RoleId ?? role.id ?? role.Id ?? ''),
      name: String(role.roleName ?? role.RoleName ?? role.name ?? role.Name ?? '').toUpperCase(),
    })).filter((r: Role) => r.id && r.name);

    return cachedRoles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

/**
 * Get role ID by role name (case-insensitive, underscore/space normalized)
 */
export const getRoleIdByName = (roleName: string): string => {
  const normalizedSearch = roleName.toUpperCase().replace(/[\s-]+/g, '_');

  // Hardcoded fallbacks for core roles (works even if API hasn't loaded yet)
  if (normalizedSearch.includes('STATE_ADMIN') || normalizedSearch.includes('ADMINISTRATOR')) {
    return ROLE_IDS.STATE_ADMIN;
  }
  if (normalizedSearch.includes('DISTRICT_STAFF') || normalizedSearch.includes('DISTRICT_ADMIN')) {
    return ROLE_IDS.DISTRICT_STAFF;
  }
  if (normalizedSearch.includes('BLOCK_STAFF') || normalizedSearch.includes('BLOCK_ADMIN')) {
    return ROLE_IDS.BLOCK_STAFF;
  }

  const role = cachedRoles.find(
    (r) =>
      r.name.replace(/[\s-]+/g, '_') === normalizedSearch
  );

  return role?.id || '';
};

/**
 * Get role label from ID
 */
export const getRoleLabel = (roleId: string): string => {
  const normalized = normalizeRoleId(roleId);
  
  // Hardcoded labels for core roles
  if (normalized === ROLE_IDS.STATE_ADMIN) return 'STATE ADMIN';
  if (normalized === ROLE_IDS.DISTRICT_STAFF) return 'DISTRICT STAFF';
  if (normalized === ROLE_IDS.BLOCK_STAFF) return 'BLOCK STAFF';

  const role = cachedRoles.find((r) => r.id === normalized);
  return role?.name || 'USER';
};

/**
 * Generic role checker
 */
export const hasRole = (
  user: User | null,
  roleName: string
): boolean => {
  const userRoleId = getUserRoleId(user);
  const targetRoleId = getRoleIdByName(roleName);

  // Compare by resolved IDs if possible
  if (userRoleId && targetRoleId) {
    return userRoleId === targetRoleId;
  }

  // Fallback: compare raw role string to name
  const rawRole = String(user?.roleId || user?.role || '').toUpperCase().replace(/[\s-]+/g, '_');
  return rawRole === roleName.toUpperCase().replace(/[\s-]+/g, '_');
};

export const isStateAdmin = (user: User | null) => {
  const roleId = getUserRoleId(user);
  // Direct numeric check first (most reliable)
  if (roleId === ROLE_IDS.STATE_ADMIN) return true;
  return hasRole(user, 'STATE_ADMIN');
};

export const isDistrictStaff = (user: User | null) => {
  const roleId = getUserRoleId(user);
  if (roleId === ROLE_IDS.DISTRICT_STAFF) return true;
  return hasRole(user, 'DISTRICT_STAFF');
};

export const isBlockStaff = (user: User | null) => {
  const roleId = getUserRoleId(user);
  if (roleId === ROLE_IDS.BLOCK_STAFF) return true;
  return hasRole(user, 'BLOCK_STAFF');
};

/**
 * Checks if a given role value belongs to a staff approval role
 * (DISTRICT_STAFF or BLOCK_STAFF — NOT STATE_ADMIN).
 */
export const isStaffApprovalRoleId = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const normalized = normalizeRoleId(value);

  if (normalized === ROLE_IDS.DISTRICT_STAFF || normalized === ROLE_IDS.BLOCK_STAFF) {
    return true;
  }

  // Name-based fallback
  const upper = String(value).toUpperCase().replace(/[\s-]+/g, '_');
  return upper === 'DISTRICT_STAFF' || upper === 'BLOCK_STAFF';
};

/**
 * Route-level access check
 */
export const canAccessRoles = (
  user: User | null,
  allowedRoles?: string[]
): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const roleId = getUserRoleId(user);
  if (allowedRoles.includes(roleId)) return true;

  // Fallback: check by name
  const rawRole = String(user?.roleId || user?.role || '').toUpperCase().replace(/[\s-]+/g, '_');
  return allowedRoles.some((allowed) => {
    const allowedName = getRoleLabel(allowed).replace(/[\s-]+/g, '_');
    return allowedName === rawRole;
  });
};

const normalizeScopeValue = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

/**
 * District / Block Filtering
 */
export const filterByDistrictAndBlock = <
  T extends Record<string, unknown>
>(
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
        return (
          normalizedValue === normalizeScopeValue(districtId) ||
          normalizedValue === normalizeScopeValue(districtName)
        );
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
        return (
          normalizedValue === normalizeScopeValue(blockId) ||
          normalizedValue === normalizeScopeValue(blockName)
        );
      }),
    );
  }

  return items;
};