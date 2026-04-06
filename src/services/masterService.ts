import api from './api';
import type { District, Block, Role, Village, GramPanchayat } from '../types/master.types';
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
};
