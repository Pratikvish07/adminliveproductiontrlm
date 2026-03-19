import api from './api';
import type { District, Block, Role, Village, GramPanchayat } from '../types/master.types';

export type SignupBlockOption = {
  blockId: number | string;
  blockName: string;
};

const MASTER_CACHE_TTL_MS = 30 * 60 * 1000;
const DISTRICTS_CACHE_KEY = 'trlm_master_districts_v1';
const ROLES_CACHE_KEY = 'trlm_master_roles_v1';
const BLOCKS_CACHE_PREFIX = 'trlm_master_blocks_v1';

type CachedValue<T> = {
  data: T;
  cachedAt: number;
};

let districtsPromise: Promise<District[]> | null = null;
let rolesPromise: Promise<Role[]> | null = null;
const blockPromises = new Map<string, Promise<SignupBlockOption[]>>();

const readCache = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedValue<T>;
    if (Date.now() - parsed.cachedAt > MASTER_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const writeCache = <T,>(key: string, data: T) => {
  try {
    const value: CachedValue<T> = {
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and continue with live data.
  }
};

export const peekCachedDistricts = (): District[] => readCache<District[]>(DISTRICTS_CACHE_KEY) ?? [];

export const peekCachedRoles = (): Role[] => readCache<Role[]>(ROLES_CACHE_KEY) ?? [];

export const peekCachedBlocks = (districtId: number | string): SignupBlockOption[] =>
  readCache<SignupBlockOption[]>(`${BLOCKS_CACHE_PREFIX}_${districtId}`) ?? [];

export const getDistricts = async (): Promise<District[]> => {
  const cached = readCache<District[]>(DISTRICTS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  if (!districtsPromise) {
    districtsPromise = api
      .get('/api/master/districts')
      .then((response) => {
        writeCache(DISTRICTS_CACHE_KEY, response.data);
        return response.data;
      })
      .finally(() => {
        districtsPromise = null;
      });
  }

  return districtsPromise;
};

export const getBlocks = async (districtId: number | string): Promise<SignupBlockOption[]> => {
  const cacheKey = `${BLOCKS_CACHE_PREFIX}_${districtId}`;
  const cached = readCache<SignupBlockOption[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const promiseKey = String(districtId);
  if (!blockPromises.has(promiseKey)) {
    blockPromises.set(
      promiseKey,
      api
        .get(`/api/master/block/${districtId}`)
        .then((response) => {
          const data = (response.data as Block[]).map((block) => ({
            blockId: block.BlockId,
            blockName: block.BlockName,
          }));
          writeCache(cacheKey, data);
          return data;
        })
        .finally(() => {
          blockPromises.delete(promiseKey);
        }),
    );
  }

  return blockPromises.get(promiseKey)!;
};

export const getRoles = async (): Promise<Role[]> => {
  const cached = readCache<Role[]>(ROLES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  if (!rolesPromise) {
    rolesPromise = api
      .get('/api/Role')
      .then((response) => {
        writeCache(ROLES_CACHE_KEY, response.data);
        return response.data;
      })
      .finally(() => {
        rolesPromise = null;
      });
  }

  return rolesPromise;
};

export const getVillages = async (gpId: number | string): Promise<Village[]> => {
  const response = await api.get(`/api/master/village/${gpId}`);
  return response.data;
};

export const getGramPanchayats = async (blockId: number | string): Promise<GramPanchayat[]> => {
  const response = await api.get(`/api/master/gp/${blockId}`);
  return response.data;
};

export const masterService = {
  getDistricts,
  getBlocks: async (districtId: number | string): Promise<Block[]> => {
    const response = await api.get(`/api/master/block/${districtId}`);
    return response.data;
  },
  getRoles,
  getVillages,
  getGramPanchayats,
};
