import React from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { crpService } from '../../services/crpService';
import api from '../../services/api';
import { getBlocks, getDistricts } from '../../services/masterService';
import { getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import { getCRPid, toCRPRecords, type CRPRecordProcessed } from './crpUtils';
import './CRPList.css';

const STATUS_COLORS: Record<string, string> = {
  Approved: '#1f9d6e',
  Pending:  '#f29f05',
  Rejected: '#d8574b',
};

/**
 * API returns approvalStatus as a number:
 *   1 → Approved, 0 → Pending, 2 → Rejected
 * Adjust the mapping below if your backend uses different values.
 */
const APPROVAL_STATUS_MAP: Record<number, string> = {
  1: 'Approved',
  0: 'Pending',
  2: 'Rejected',
};

const formatCount = (value: number): string =>
  new Intl.NumberFormat('en-IN').format(value);

const clampDegrees = (value: number): number => Math.min(360, Math.max(0, value));

/**
 * Resolves approvalStatus (number or string) to a human-readable label.
 */
const formatStatus = (value: unknown): string => {
  if (typeof value === 'number') {
    return APPROVAL_STATUS_MAP[value] ?? 'Pending';
  }
  const str = String(value ?? '').trim();
  if (/^\d+$/.test(str)) {
    return APPROVAL_STATUS_MAP[Number(str)] ?? 'Pending';
  }
  return str || 'Pending';
};

const toIdString = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value).trim();
};

const isUsableLabel = (value: unknown): boolean => {
  const s = String(value ?? '').trim();
  return s !== '' && s !== 'N/A' && !/^\d+$/.test(s);
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as {
      response?: {
        status?: number;
        data?: unknown;
      };
    }).response;

    const message =
      typeof response?.data === 'object' &&
      response?.data !== null &&
      'message' in response.data
        ? String((response.data as { message?: unknown }).message ?? '')
        : '';

    return message
      ? `HTTP ${response?.status ?? 'unknown'}: ${message}`
      : `HTTP ${response?.status ?? 'unknown'}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

// ---------------------------------------------------------------------------
// Village master fetch
// ---------------------------------------------------------------------------
/**
 * Fetches all villages from the master API and returns villageId → villageName map.
 * Tries common field name variants to handle API shape differences.
 */
const fetchVillageMap = async (): Promise<Map<string, string>> => {
  try {
    const response = await api.get<unknown>('/master/village');
    const payload = response.data;

    if (!Array.isArray(payload)) {
      throw new Error('Village API did not return an array payload');
    }

    const map = new Map<string, string>();

    for (const item of payload) {
      if (typeof item !== 'object' || item === null) continue;
      const row = item as Record<string, unknown>;

      const id =
        row['villageId']   ??
        row['VillageId']   ??
        row['village_id']  ??
        row['id']          ?? '';

      const name =
        row['villageName']  ??
        row['VillageName']  ??
        row['village_name'] ??
        row['name']         ?? '';

      const idStr   = String(id).trim();
      const nameStr = String(name).trim();

      if (idStr && nameStr) {
        map.set(idStr, nameStr);
      }
    }

    console.log('[fetchVillageMap] loaded', map.size, 'villages — sample:', [...map.entries()][0]);
    return map;
  } catch (err) {
    console.warn(
      '[fetchVillageMap] failed — village names will fall back to IDs:',
      getErrorMessage(err),
      err,
    );
    return new Map();
  }
};

// ---------------------------------------------------------------------------
// enrichCRPRecords
// ---------------------------------------------------------------------------
/**
 * Actual API record shape (confirmed from console log):
 * {
 *   aadhaarNo, approvalStatus (number), blockId (number),
 *   contactNo, createdDate, crpId, crpRegistrationId,
 *   fullName, villageId (number)
 * }
 *
 * Key findings:
 *  - NO districtId in record → district is derived via blockId lookup
 *  - approvalStatus is numeric (1=Approved, 0=Pending, 2=Rejected)
 *  - name field is fullName
 *  - villageId resolved to villageName via /master/village
 */
const enrichCRPRecords = async (
  rawRecords: Record<string, unknown>[],
  processedRecords: CRPRecordProcessed[],
): Promise<CRPRecordProcessed[]> => {

  // ------------------------------------------------------------------
  // 1. Fetch districts + villages in parallel
  // ------------------------------------------------------------------
  const [districts, villageMap] = await Promise.all([
    getDistricts().catch(() => []),
    fetchVillageMap(),
  ]);
  console.log('[enrichCRPRecords] districts sample:', districts[0]);

  // districtId → districtName
  const districtNameMap = new Map<string, string>(
    districts.map((d) => [
      String(d.districtId ?? ''),
      String(d.districtName ?? ''),
    ]),
  );

  // ------------------------------------------------------------------
  // 2. Fetch blocks for EVERY district → build blockId → { blockName, districtId }
  //    This is necessary because raw records have blockId but NO districtId.
  // ------------------------------------------------------------------
  const blockDetailMap = new Map<string, { blockName: string; districtId: string }>();

  await Promise.all(
    districts.map(async (d) => {
      const districtId = String(d.districtId ?? '');
      if (!districtId) return;

      const blocks = await getBlocks(districtId).catch(() => []);
      if (blocks.length > 0) {
        console.log('[enrichCRPRecords] blocks sample for district', districtId, ':', blocks[0]);
      }

      blocks.forEach((block) => {
        const blockId = String(block.blockId ?? '');
        if (blockId) {
          blockDetailMap.set(blockId, {
            blockName:  String(block.blockName ?? ''),
            districtId,
          });
        }
      });
    }),
  );

  // ------------------------------------------------------------------
  // 3. Map every record using the resolved lookups
  // ------------------------------------------------------------------
  return processedRecords.map((record, index) => {
    const raw = rawRecords[index];

    // blockId is confirmed present in raw record as a number
    const blockId     = toIdString(raw['blockId'] ?? raw['BlockId'] ?? raw['block_id'] ?? '');
    const blockDetail = blockDetailMap.get(blockId);

    const blockName = blockDetail?.blockName
      ?? (isUsableLabel(record.block) ? String(record.block) : 'N/A');

    const districtId   = blockDetail?.districtId ?? '';
    const districtName = (districtId ? districtNameMap.get(districtId) : undefined)
      ?? (isUsableLabel(record.district) ? String(record.district) : 'N/A');

    // Village: resolve villageId → villageName via master API map
    const villageId   = toIdString(raw['villageId'] ?? raw['VillageId'] ?? raw['village_id'] ?? '');
    const villageName = isUsableLabel(record.village)
      ? String(record.village)
      : villageMap.get(villageId) ?? (villageId || 'N/A');

    // Name: API returns fullName, not name
    const name = toIdString(raw['fullName'] ?? raw['name'] ?? '') || String(record.name ?? 'N/A');

    // Status: API returns numeric approvalStatus
    const rawStatus = raw['approvalStatus'] ?? raw['status'] ?? record.status;
    const status    = formatStatus(rawStatus);

    return {
      ...record,
      name,
      district: districtName,
      block:    blockName,
      village:  villageName,
      status,
    };
  });
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CRPList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { districtId, blockId } = useResolvedScope(user);
  const hasLoadedRef = React.useRef(false);
  const [records, setRecords] = React.useState<CRPRecordProcessed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const roleId = getUserRoleId(user);

  const loadCRPList = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      let scopedRecords: Record<string, unknown>[] = [];

      if (roleId === ROLE_IDS.DISTRICT_STAFF) {
        if (!districtId) {
          setError('District scope is missing for this user.');
          setRecords([]);
          return;
        }
        scopedRecords = await crpService.getCRPByDistrict(districtId) as Record<string, unknown>[];
      } else if (roleId === ROLE_IDS.BLOCK_STAFF) {
        if (!blockId) {
          setError('Block scope is missing for this user.');
          setRecords([]);
          return;
        }
        scopedRecords = await crpService.getCRPByBlock(blockId) as Record<string, unknown>[];
      } else {
        scopedRecords = await crpService.getCRPList() as Record<string, unknown>[];
      }

      const processed = toCRPRecords(scopedRecords);
      const enriched  = await enrichCRPRecords(scopedRecords, processed);

      setRecords(enriched);
    } catch (err) {
      console.error('[CRPList] Failed to load records', err);
      setError('Live CRP list is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, [blockId, districtId, roleId]);

  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadCRPList();
  }, [loadCRPList]);

  // ------------------------------------------------------------------
  // Derived state
  // ------------------------------------------------------------------

  const totalRecords = records.length;

  const statusBreakdown = React.useMemo(() => {
    return ['Approved', 'Pending', 'Rejected'].map((status) => ({
      label: status,
      count: records.filter((r) => formatStatus(r.status) === status).length,
    }));
  }, [records]);

  const districtBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const key = String(r.district ?? 'Unknown');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const blockBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const key = `${r.district ?? 'Unknown'} / ${r.block ?? 'Unknown'}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  const maxChartValue = React.useMemo(() => {
    const values = [
      ...statusBreakdown.map((i) => i.count),
      ...districtBreakdown.map((i) => i.count),
      ...blockBreakdown.map((i) => i.count),
    ];
    return Math.max(...values, 1);
  }, [blockBreakdown, districtBreakdown, statusBreakdown]);

  const recentRecords = React.useMemo(() => records.slice(0, 8), [records]);
  const approvedCount = statusBreakdown.find((item) => item.label === 'Approved')?.count ?? 0;
  const pendingCount = statusBreakdown.find((item) => item.label === 'Pending')?.count ?? 0;
  const approvalRate = totalRecords === 0 ? 0 : Math.round((approvedCount / totalRecords) * 100);
  const villagesCovered = React.useMemo(() => {
    const villageSet = new Set(
      records.map((record) => String(record.village ?? record.villageId ?? '').trim()).filter(Boolean),
    );
    return villageSet.size;
  }, [records]);
  const topDistrictLabel = districtBreakdown[0]?.label ?? 'No district yet';
  const topDistrictCount = districtBreakdown[0]?.count ?? 0;
  const topBlockLabel = blockBreakdown[0]?.label ?? 'No block yet';
  const topBlockCount = blockBreakdown[0]?.count ?? 0;
  const statusChartStyle = {
    background: `conic-gradient(
      #1f9d6e 0deg ${clampDegrees(totalRecords === 0 ? 0 : (approvedCount / totalRecords) * 360)}deg,
      #f29f05 ${clampDegrees(totalRecords === 0 ? 0 : (approvedCount / totalRecords) * 360)}deg ${clampDegrees(totalRecords === 0 ? 0 : ((approvedCount + pendingCount) / totalRecords) * 360)}deg,
      #d8574b ${clampDegrees(totalRecords === 0 ? 0 : ((approvedCount + pendingCount) / totalRecords) * 360)}deg 360deg
    )`,
  };
  const summaryCards = [
    {
      label: 'Approval rate',
      value: `${approvalRate}%`,
      note: `${formatCount(approvedCount)} approved out of ${formatCount(totalRecords)}`,
      tone: 'approved',
    },
    {
      label: 'Villages covered',
      value: formatCount(villagesCovered),
      note: 'Unique villages across the current CRP dataset',
      tone: 'info',
    },
    {
      label: 'Top district',
      value: topDistrictLabel,
      note: `${formatCount(topDistrictCount)} CRP records concentrated here`,
      tone: 'accent',
    },
    {
      label: 'Pending review',
      value: formatCount(pendingCount),
      note: 'Records still waiting for action',
      tone: 'pending',
    },
  ];
  const coveragePulse = [
    ...districtBreakdown.slice(0, 3).map((item) => ({
      label: item.label,
      count: item.count,
      caption: 'District load',
    })),
    ...blockBreakdown.slice(0, 3).map((item) => ({
      label: item.label,
      count: item.count,
      caption: 'District / Block pair',
    })),
  ].slice(0, 6);

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
            {loading && <span className="crp-status-badge">Loading</span>}
            {error && <span className="crp-status-badge crp-status-badge--warn">API Error</span>}
          </div>
        </div>

        <div className="crp-hero__metric">
          <span>Total CRP records</span>
          <strong>{formatCount(totalRecords)}</strong>
          <p>
            Approved {formatCount(statusBreakdown.find((i) => i.label === 'Approved')?.count ?? 0)} ·
            Pending {formatCount(statusBreakdown.find((i) => i.label === 'Pending')?.count ?? 0)} ·
            Rejected {formatCount(statusBreakdown.find((i) => i.label === 'Rejected')?.count ?? 0)}
          </p>
        </div>
      </section>

      {error && <div className="crp-alert">{error}</div>}

      <section className="crp-summary-strip">
        {summaryCards.map((card) => (
          <article className={`crp-summary-card crp-summary-card--${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="crp-grid">
        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Status Signal</span>
              <h2>Live approval mix</h2>
              <p>A quick visual split of approved, pending, and rejected CRP records.</p>
            </div>
          </div>

          <div className="crp-status-wheel">
            <div className="crp-status-wheel__chart" style={statusChartStyle}>
              <div className="crp-status-wheel__center">
                <strong>{formatCount(totalRecords)}</strong>
                <span>Total records</span>
              </div>
            </div>

            <div className="crp-status-wheel__legend">
              {statusBreakdown.map((item) => (
                <div className="crp-status-wheel__legend-item" key={item.label}>
                  <span
                    className="crp-status-wheel__dot"
                    style={{ backgroundColor: STATUS_COLORS[item.label] ?? '#1f78b4' }}
                  />
                  <div>
                    <strong>{item.label}</strong>
                    <span>{formatCount(item.count)} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Field Pulse</span>
              <h2>Coverage momentum</h2>
              <p>Quick intensity bars showing where most CRP activity is clustered right now.</p>
            </div>
          </div>

          <div className="crp-pulse-list">
            {coveragePulse.map((item) => (
              <div className="crp-pulse-list__item" key={`${item.caption}-${item.label}`}>
                <div className="crp-pulse-list__meta">
                  <span>{item.caption}</span>
                  <strong>{item.label}</strong>
                </div>
                <div className="crp-pulse-list__bar">
                  <div
                    className="crp-pulse-list__fill"
                    style={{ width: `${Math.max((item.count / maxChartValue) * 100, 10)}%` }}
                  />
                </div>
                <em>{formatCount(item.count)}</em>
              </div>
            ))}
          </div>
        </article>

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
              <p>{topBlockLabel} currently leads with {formatCount(topBlockCount)} records.</p>
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
                const crpId = getCRPid(record);
                const villageId = String(record.villageId ?? '').trim();
                const canOpenMembers = Boolean(crpId && villageId);
                return (
                  <article className="crp-list__card" key={crpId || index}>
                    <div className="crp-list__identity">
                      <div className="crp-list__avatar">
                        {String(record.name ?? 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="crp-list__copy">
                        {canOpenMembers ? (
                          <button
                            type="button"
                            className="crp-link-button"
                            onClick={() => navigate(`/crp/${crpId}/shg-members?villageId=${encodeURIComponent(villageId)}`)}
                          >
                            {String(record.name ?? 'N/A')}
                          </button>
                        ) : (
                          <strong>{String(record.name ?? 'N/A')}</strong>
                        )}
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
                        <label>Village</label>
                        <span>{String(record.village ?? record.villageId ?? '-')}</span>
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
