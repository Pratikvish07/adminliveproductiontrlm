import api from './api';
import type { District, Block, Role, Village, GramPanchayat, SubCategory, LivelihoodActivity } from '../types/master.types';
import { getWithFallback } from './requestFallback';

export type SignupBlockOption = {
  blockId: number | string;
  blockName: string;
};

export type DashboardCount = {
  Title: string;
  TotalCount: number;
};

let districtsPromise: Promise<District[]> | null = null;
let rolesPromise: Promise<Role[]> | null = null;
const blockPromises = new Map<string, Promise<SignupBlockOption[]>>();

const toDistrictOptions = (payload: unknown): District[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((district) => {
      const record = district as Record<string, unknown>;
      return {
        districtId: Number(
          record.districtId ?? record.DistrictId ?? record.id ?? record.Id ?? 0,
        ),
        districtName: String(
          record.districtName ?? record.DistrictName ?? record.name ?? record.Name ?? '',
        ),
      };
    })
    .filter((district) => district.districtId && district.districtName);
};

const toBlockOptions = (payload: unknown): SignupBlockOption[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((block) => {
      const record = block as Record<string, unknown>;
      return {
        blockId: String(record.blockId ?? record.BlockId ?? record.id ?? record.Id ?? ''),
        blockName: String(record.blockName ?? record.BlockName ?? record.name ?? record.Name ?? ''),
      };
    })
    .filter((block) => block.blockId && block.blockName);
};

const toRoleOptions = (payload: unknown): Role[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((role) => {
      const record = role as Record<string, unknown>;
      return {
        roleId: Number(record.roleId ?? record.RoleId ?? record.id ?? record.Id ?? 0),
        roleName: String(record.roleName ?? record.RoleName ?? record.name ?? record.Name ?? ''),
        createdDate: String(record.createdDate ?? record.CreatedDate ?? ''),
      };
    })
    .filter((role) => role.roleId && role.roleName);
};

export const getDistricts = async (): Promise<District[]> => {
  if (!districtsPromise) {
    districtsPromise = getWithFallback<unknown>([
      '/master/districts',
      '/master/district',
      '/districts',
      '/district',
    ])
      .then((response) => toDistrictOptions(response))
      .finally(() => {
        districtsPromise = null;
      });
  }

  return districtsPromise;
};

export const getBlocks = async (districtId: number | string): Promise<SignupBlockOption[]> => {
  const promiseKey = String(districtId);
  if (!blockPromises.has(promiseKey)) {
    blockPromises.set(
      promiseKey,
      getWithFallback<unknown>([
        `/master/block/${districtId}`,
        `/master/blocks/${districtId}`,
        `/block/${districtId}`,
        `/blocks/${districtId}`,
      ])
        .then((response) => toBlockOptions(response))
        .finally(() => {
          blockPromises.delete(promiseKey);
        }),
    );
  }

  return blockPromises.get(promiseKey)!;
};

export const getRoles = async (): Promise<Role[]> => {
  if (!rolesPromise) {
    rolesPromise = getWithFallback<unknown>([
      '/Role',
      '/role',
      '/roles',
      '/master/role',
      '/master/roles',
    ])
      .then((response) => toRoleOptions(response))
      .finally(() => {
        rolesPromise = null;
      });
  }

  return rolesPromise;
};

export const getVillages = async (gpId: number | string): Promise<Village[]> => {
  const response = await api.get(`/master/village/${gpId}`);
  return response.data;
};

export const getGramPanchayats = async (blockId: number | string): Promise<GramPanchayat[]> => {
  const response = await api.get(`/master/gp/${blockId}`);
  return response.data;
};

export const getDashboardCounts = async (): Promise<DashboardCount[]> => {
  const response = await getWithFallback<unknown>([
    '/master/dashboard-counts',
    '/dashboard-counts',
  ]);
  return Array.isArray(response) ? response as DashboardCount[] : [];
};

// ── Role CRUD ─────────────────────────────────────────────────────────────

export const getRoleById = async (id: number): Promise<Role> => {
  const response = await api.get(`/Role/${id}`);
  return response.data;
};

export const createRole = async (data: {
  roleName: string;
}): Promise<Role> => {
  // POST /Role — JSON body: { roleId: 0, roleName: "string", createdDate: "..." }
  const response = await api.post('/Role', {
    roleId: 0,
    roleName: data.roleName,
    createdDate: new Date().toISOString(),
  });
  return response.data;
};

export const updateRole = async (id: number, data: {
  roleName: string;
}): Promise<void> => {
  // Try query params first as it's common in this backend
  await api.put('/Role', null, {
    params: { roleId: id, roleName: data.roleName },
  });
};

export const deleteRole = async (id: number): Promise<void> => {
  // Try both casing if one fails, but starting with PascalCase
  await api.delete('/Role', {
    params: { roleId: id },
  });
};

export const getSubCategories = async (): Promise<SubCategory[]> => {
  // Try PascalCase for consistency with Role
  const response = await api.get('/SubCategory');
  const raw = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
  
  // Robust mapping for field variations
  return raw.map((item: any) => ({
    SubCategoryId: Number(item.SubCategoryId ?? item.subCategoryId ?? item.id ?? 0),
    ActivityId: Number(item.ActivityId ?? item.activityId ?? item.IdActivity ?? 0),
    SubCategoryName: String(item.SubCategoryName ?? item.subCategoryName ?? item.name ?? ''),
  }));
};

export const createSubCategory = async (data: {
  ActivityId: number;
  SubCategoryName: string;
}): Promise<SubCategory> => {
  // POST /SubCategory?ActivityId=...&SubCategoryName=...
  const response = await api.post('/SubCategory', null, {
    params: { ActivityId: data.ActivityId, SubCategoryName: data.SubCategoryName },
  });
  return response.data;
};

export const updateSubCategory = async (data: {
  SubCategoryId: number;
  ActivityId: number;
  SubCategoryName: string;
}): Promise<void> => {
  await api.put('/SubCategory', null, {
    params: {
      SubCategoryId: data.SubCategoryId,
      ActivityId: data.ActivityId,
      SubCategoryName: data.SubCategoryName,
    },
  });
};

export const deleteSubCategory = async (subCategoryId: number): Promise<void> => {
  await api.delete('/SubCategory', { params: { SubCategoryId: subCategoryId } });
};

// ── LivelihoodActivity CRUD ───────────────────────────────────────────────

export const getActivities = async (): Promise<LivelihoodActivity[]> => {
  const response = await api.get('/activity');
  const raw = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
  
  return raw.map((item: any) => ({
    ActivityId: Number(item.ActivityId ?? item.activityId ?? item.id ?? 0),
    ActivityName: String(item.ActivityName ?? item.activityName ?? item.name ?? ''),
  }));
};

export const createActivity = async (name: string): Promise<LivelihoodActivity> => {
  // POST /activity?ActivityName=...
  const response = await api.post('/activity', null, {
    params: { ActivityName: name },
  });
  return response.data;
};

export const updateActivity = async (id: number, name: string): Promise<void> => {
  // PUT /activity?ActivityId=...&ActivityName=...
  await api.put('/activity', null, {
    params: { ActivityId: id, ActivityName: name },
  });
};

export const deleteActivity = async (id: number): Promise<void> => {
  // DELETE /activity?ActivityId=...
  await api.delete('/activity', {
    params: { ActivityId: id },
  });
};

export const masterService = {
  getDistricts,
  getBlocks: async (districtId: number | string): Promise<Block[]> => {
    const response = await getWithFallback<unknown>([
      `/master/block/${districtId}`,
      `/master/blocks/${districtId}`,
      `/block/${districtId}`,
      `/blocks/${districtId}`,
    ]);

    return toBlockOptions(response).map((block) => ({
      BlockId: Number(block.blockId),
      BlockName: block.blockName,
    }));
  },
  getRoles,
  getVillages,
  getGramPanchayats,
  getDashboardCounts,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
};
