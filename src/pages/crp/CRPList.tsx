import React from 'react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { crpService } from '../../services/crpService';
import { getBlocks, getDistricts } from '../../services/masterService';
import { filterByDistrictAndBlock } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import { getCRPid, toCRPRecords, type CRPRecordProcessed } from './crpUtils-clean';
import './CRPList.css';

const CRP_LIST_CACHE_KEY = 'trlm_crp_list_cache_v1';
const CRP_LIST_CACHE_TTL_MS = 15 * 60 * 1000;

type CRPListCache = {
  records: CRPRecordProcessed[];
  cachedAt: number;
};

const STATUS_COLORS: Record<string, string> = {
  Approved: '#1f9d6e',
  Pending: '#f29f05',
  Rejected: '#d8574b',
};

const readCRPCache = (): CRPListCache | null => {
  try {
    const raw = localStorage.getItem(CRP_LIST_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CRPListCache;
    if (Date.now() - parsed.cachedAt > CRP_LIST_CACHE_TTL_MS) {
      localStorage.removeItem(CRP_LIST_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(CRP_LIST_CACHE_KEY);
    return null;
  }
};

const getLastUpdatedText = (cachedAt: number): string => {
  const diffMs = Date.now() - cachedAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  return diffMinutes === 0 ? 'Updated just now' : `Updated ${diffMinutes} min ago`;
};

const formatCount = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const formatStatus = (value: unknown): string => {
  const normalized = String(value ?? 'Pending').trim();
  return normalized || 'Pending';
};

const isUsableLabel = (value: unknown): boolean => {
  const normalized = String(value ?? '').trim();
  return normalized !== '' && normalized !== 'N/A' && !/^\d+$/.test(normalized);
};

const findFirstCandidate = (
  value: unknown,
  keys: string[],
  depth = 0,
): unknown => {
  if (depth > 5 || value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findFirstCandidate(item, keys, depth + 1);
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
    const direct = record[key];
    if (direct !== undefined && direct !== null && direct !== '') {
      return direct;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nested = findFirstCandidate(nestedValue, keys, depth + 1);
    if (nested !== undefined && nested !== null && nested !== '') {
      return nested;
    }
  }

  return undefined;
};

const toIdString = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value).trim();
};

const enrichCRPRecords = async (
  rawRecords: Record<string, unknown>[],
  processedRecords: CRPRecordProcessed[],
): Promise<CRPRecordProcessed[]> => {
  const districts = await getDistricts().catch(() => []);
  const districtMap = new Map(districts.map((district) => [String(district.districtId), district.districtName]));

  const neededDistrictIds = new Set<string>();

  processedRecords.forEach((record, index) => {
    if (!isUsableLabel(record.district)) {
      const districtId = toIdString(findFirstCandidate(rawRecords[index], ['districtId', 'DistrictId', 'district']));
      if (districtId) {
        neededDistrictIds.add(districtId);
      }
    }
  });

  const blockMap = new Map<string, string>();
  await Promise.all(
    Array.from(neededDistrictIds).map(async (districtId) => {
      const blocks = await getBlocks(districtId).catch(() => []);
      blocks.forEach((block) => {
        blockMap.set(String(block.blockId), block.blockName);
      });
    }),
  );

  return processedRecords.map((record, index) => {
    const rawRecord = rawRecords[index];
    const districtId = toIdString(findFirstCandidate(rawRecord, ['districtId', 'DistrictId', 'district']));
    const blockId = toIdString(findFirstCandidate(rawRecord, ['blockId', 'BlockId', 'block']));

    const districtName = isUsableLabel(record.district)
      ? String(record.district)
      : districtMap.get(districtId) ?? 'N/A';
    const blockName = isUsableLabel(record.block)
      ? String(record.block)
      : blockMap.get(blockId) ?? 'N/A';

    return {
      ...record,
      district: districtName,
      block: blockName,
    };
  });
};

const CRPList: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const hasLoadedRef = React.useRef(false);
  const cached = React.useMemo(() => readCRPCache(), []);
  const [records, setRecords] = React.useState<CRPRecordProcessed[]>(cached?.records ?? []);
  const [loading, setLoading] = React.useState(!cached);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [lastUpdatedText, setLastUpdatedText] = React.useState(cached ? getLastUpdatedText(cached.cachedAt) : '');

  const loadCRPList = React.useCallback(async (refreshOnly: boolean) => {
    try {
      setError('');
      setIsRefreshing(refreshOnly);
      setLoading(!refreshOnly && records.length === 0);

      const response = await crpService.getCRPList();
      const scopedRecords = filterByDistrictAndBlock(
        response as Record<string, unknown>[],
        scopedUser,
        ['districtId', 'district', 'districtName', 'DistrictId', 'District', 'DistrictName'],
        ['blockId', 'block', 'blockName', 'BlockId', 'Block', 'BlockName'],
      );
      const processed = toCRPRecords(scopedRecords);
      const enriched = await enrichCRPRecords(scopedRecords, processed);

      setRecords(enriched);
      const nextCache: CRPListCache = {
        records: enriched,
        cachedAt: Date.now(),
      };
      localStorage.setItem(CRP_LIST_CACHE_KEY, JSON.stringify(nextCache));
      setLastUpdatedText(getLastUpdatedText(nextCache.cachedAt));
    } catch (err) {
      console.error('[CRPList] Failed to load records', err);
      setError('Live CRP list is unavailable right now, so cached data is being shown when available.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [records.length, scopedUser]);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void loadCRPList(Boolean(cached?.records.length));
  }, [cached?.records.length, loadCRPList]);

  const totalRecords = records.length;

  const statusBreakdown = React.useMemo(() => {
    const statuses = ['Approved', 'Pending', 'Rejected'];
    return statuses.map((status) => ({
      label: status,
      count: records.filter((record) => formatStatus(record.status) === status).length,
    }));
  }, [records]);

  const districtBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const district = String(record.district ?? 'Unknown');
      map.set(district, (map.get(district) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const blockBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const key = `${record.district ?? 'Unknown'} / ${record.block ?? 'Unknown'}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  const maxChartValue = React.useMemo(() => {
    const values = [
      ...statusBreakdown.map((item) => item.count),
      ...districtBreakdown.map((item) => item.count),
      ...blockBreakdown.map((item) => item.count),
    ];

    return Math.max(...values, 1);
  }, [blockBreakdown, districtBreakdown, statusBreakdown]);

  const recentRecords = React.useMemo(() => records.slice(0, 8), [records]);

  if (loading && records.length === 0) {
    return <Loader />;
  }

  return (
    <div className="crp-page">
      <section className="crp-hero">
        <div className="crp-hero__copy">
          <p className="crp-kicker">CRP Field Intelligence</p>
          <h1 className="crp-title">Live CRP records, visualized from API data</h1>
          <p className="crp-subtitle">
            This page is now driven only by live CRP list data. The visuals, counts, and content list all respond
            directly to what the API returns for your current scope.
          </p>
          <div className="crp-hero__status">
            {lastUpdatedText && <span>{lastUpdatedText}</span>}
            {isRefreshing && <span className="crp-status-badge">Refreshing</span>}
            {error && <span className="crp-status-badge crp-status-badge--warn">Cached</span>}
          </div>
        </div>

        <div className="crp-hero__metric">
          <span>Total CRP records</span>
          <strong>{formatCount(totalRecords)}</strong>
          <p>
            Approved {formatCount(statusBreakdown.find((item) => item.label === 'Approved')?.count ?? 0)} ·
            Pending {formatCount(statusBreakdown.find((item) => item.label === 'Pending')?.count ?? 0)} ·
            Rejected {formatCount(statusBreakdown.find((item) => item.label === 'Rejected')?.count ?? 0)}
          </p>
        </div>
      </section>

      {error && <div className="crp-alert">{error}</div>}

      <section className="crp-grid">
        <article className="crp-panel crp-panel--wide">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Status Overview</span>
              <h2>Status distribution</h2>
            </div>
          </div>

          <div className="crp-status-bars">
            {statusBreakdown.map((item) => {
              const width = (item.count / maxChartValue) * 100;
              const color = STATUS_COLORS[item.label] ?? '#1f78b4';

              return (
                <div className="crp-status-bars__row" key={item.label}>
                  <div className="crp-status-bars__meta">
                    <span>{item.label}</span>
                    <strong>{formatCount(item.count)}</strong>
                  </div>
                  <div className="crp-status-bars__track">
                    <div
                      className="crp-status-bars__fill"
                      style={{
                        width: `${Math.max(width, 8)}%`,
                        background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.92))`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">District View</span>
              <h2>District concentration</h2>
            </div>
          </div>

          <div className="crp-district-grid">
            {districtBreakdown.map((item) => {
              const intensity = Math.round((item.count / maxChartValue) * 100);
              return (
                <div
                  className="crp-district-card"
                  key={item.label}
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.97), color-mix(in srgb, #1f78b4 ${Math.max(intensity, 20)}%, white))`,
                  }}
                >
                  <span>{item.label}</span>
                  <strong>{formatCount(item.count)}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Coverage View</span>
              <h2>Top district-block pairs</h2>
            </div>
          </div>

          <div className="crp-pair-list">
            {blockBreakdown.map((item) => (
              <div className="crp-pair-list__item" key={item.label}>
                <span>{item.label}</span>
                <strong>{formatCount(item.count)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="crp-panel crp-panel--wide">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Content List</span>
              <h2>Recent CRP records</h2>
              <p>Only API-driven CRP entries are shown here.</p>
            </div>
          </div>

          {recentRecords.length === 0 ? (
            <div className="crp-empty">No CRP records found.</div>
          ) : (
            <div className="crp-list">
              {recentRecords.map((record, index) => {
                const status = formatStatus(record.status);
                return (
                  <article className="crp-list__card" key={getCRPid(record) || index}>
                    <div className="crp-list__identity">
                      <div className="crp-list__avatar">
                        {String(record.name ?? 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="crp-list__copy">
                        <strong>{String(record.name ?? 'N/A')}</strong>
                        <span>{String(record.crpId ?? record.crpRegistrationId ?? '-')}</span>
                      </div>
                    </div>

                    <div className="crp-list__meta">
                      <div>
                        <label>District</label>
                        <span>{String(record.district ?? 'N/A')}</span>
                      </div>
                      <div>
                        <label>Block</label>
                        <span>{String(record.block ?? 'N/A')}</span>
                      </div>
                      <div>
                        <label>Aadhaar</label>
                        <span>{String(record.aadhaarNo ?? '-')}</span>
                      </div>
                      <div>
                        <label>Contact</label>
                        <span>{String(record.contactNo ?? '-')}</span>
                      </div>
                      <div>
                        <label>Village ID</label>
                        <span>{String(record.villageId ?? '-')}</span>
                      </div>
                      <div>
                        <label>Created</label>
                        <span>{String(record.createdDate ?? '-')}</span>
                      </div>
                    </div>

                    <span className={`crp-list__status crp-list__status--${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default CRPList;
