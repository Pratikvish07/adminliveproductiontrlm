import type { CRPRecord } from '../../services/crpService';
import type { PendingCRPRecord } from '../../services/crpService';
import { getDistricts, getBlocks, getGramPanchayats, getVillages } from '../../services/masterService';

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

const resolveVillageValue = (record: Record<string, unknown>): string => {
  const directValue = getFirstValue(record, [
    'villageName',
    'VillageName',
    'village',
    'Village',
    'villageMaster',
    'VillageMaster',
    'villageData',
    'VillageData',
  ]);

  if (directValue !== undefined && directValue !== null && directValue !== '') {
    return normalizeText(directValue);
  }

  return normalizeText(
    findNestedValueByKeys(record, [
      'villageName',
      'VillageName',
      'name',
      'Name',
      'label',
      'Label',
      'title',
      'Title',
    ]),
    '',
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
    village: resolveVillageValue(record),
    status: normalizeStatus(record),
  }));
}

export function getCRPid(record: CRPRecordProcessed): string {
  return String(
    (record as any).crpRegistrationId ||
    (record as any).crpId ||
    (record as any).CRPId ||
    (record as any).id ||
    '',
  );
}

export function formatCRPValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

// ---------------------------------------------------------------------------
// District / Block / Gram Panchayat / Village lookup
// ---------------------------------------------------------------------------
// A CRP registration record only carries blockId + villageId (no districtId,
// no gramPanchayatId). The master API has no "list all villages"/"list all
// GPs" endpoint either — villages are only listable per Gram Panchayat
// (GET /master/village/{gpId}) and GPs only per block (GET /master/gp/{blockId}).
// So resolving a villageId to a name (and to its Gram Panchayat) means
// walking block -> GP -> village for every block actually referenced by the
// records being enriched.

export const toIdString = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).trim();
};

export type LocationLookup = {
  districtNameMap: Map<string, string>;
  blockDetailMap: Map<string, { blockName: string; districtId: string }>;
};

/**
 * Builds districtId → districtName and blockId → { blockName, districtId }
 * lookups so any record carrying blockId can be resolved to a district/block name.
 */
export const buildLocationLookup = async (): Promise<LocationLookup> => {
  const districts = await getDistricts().catch(() => []);

  const districtNameMap = new Map<string, string>(
    districts.map((d) => [String(d.districtId ?? ''), String(d.districtName ?? '')]),
  );

  const blockDetailMap = new Map<string, { blockName: string; districtId: string }>();

  await Promise.all(
    districts.map(async (d) => {
      const districtId = String(d.districtId ?? '');
      if (!districtId) return;

      const blocks = await getBlocks(districtId).catch(() => []);
      blocks.forEach((block) => {
        const blockId = String(block.blockId ?? '');
        if (blockId) {
          blockDetailMap.set(blockId, {
            blockName: String(block.blockName ?? ''),
            districtId,
          });
        }
      });
    }),
  );

  return { districtNameMap, blockDetailMap };
};

export type VillageGpLookup = Map<string, { villageName: string; gpName: string }>;

/**
 * Resolves villageId → { villageName, gpName } by walking block -> GP -> village,
 * scoped to only the given block ids (villages/GPs cannot be listed in bulk).
 */
export const buildVillageGpLookup = async (blockIds: string[]): Promise<VillageGpLookup> => {
  const map: VillageGpLookup = new Map();
  const uniqueBlockIds = Array.from(new Set(blockIds.filter(Boolean)));

  await Promise.all(
    uniqueBlockIds.map(async (blockId) => {
      const gramPanchayats = await getGramPanchayats(blockId).catch(() => []);

      await Promise.all(
        gramPanchayats.map(async (gp) => {
          const gpName = String(gp.GPName ?? '');
          const villages = await getVillages(gp.GPId).catch(() => []);

          villages.forEach((village) => {
            const villageId = String(village.VillageId ?? '');
            if (villageId) {
              map.set(villageId, { villageName: String(village.VillageName ?? ''), gpName });
            }
          });
        }),
      );
    }),
  );

  return map;
};

/**
 * Resolves district/block/gramPanchayat/village names for a raw record
 * carrying blockId/villageId (e.g. a CRP registration), using lookups built
 * by `buildLocationLookup` and `buildVillageGpLookup`.
 */
export const resolveLocationForRecord = (
  raw: Record<string, unknown>,
  lookup: LocationLookup,
  villageGpLookup: VillageGpLookup,
): { district: string; block: string; gramPanchayat: string; village: string } => {
  const blockId = toIdString(raw['blockId'] ?? raw['BlockId'] ?? raw['block_id'] ?? '');
  const blockDetail = lookup.blockDetailMap.get(blockId);
  const districtId = blockDetail?.districtId ?? '';

  const villageId = toIdString(raw['villageId'] ?? raw['VillageId'] ?? raw['village_id'] ?? '');
  const villageInfo = villageGpLookup.get(villageId);

  return {
    district: (districtId ? lookup.districtNameMap.get(districtId) : undefined) || 'N/A',
    block: blockDetail?.blockName || 'N/A',
    gramPanchayat: villageInfo?.gpName || 'N/A',
    village: villageInfo?.villageName || 'N/A',
  };
};

