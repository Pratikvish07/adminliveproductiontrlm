import api from './api';
import type { SHGTrackingRecord } from './reportService';

export type MemberDisplayLookups = {
  activities: Record<string, string>;
  activityTypes: Record<string, string>;
  units: Record<string, string>;
  seasons: Record<string, string>;
  landTypes: Record<string, string>;
  trades: Record<string, string>;
  agencies: Record<string, string>;
};

const emptyLookup = (): Record<string, string> => ({});
let memberDisplayLookupsPromise: Promise<MemberDisplayLookups> | null = null;

const lookupRecords = (payload: unknown): Record<string, unknown>[] => {
  let value = payload;
  for (let depth = 0; depth < 2 && value && typeof value === 'object' && !Array.isArray(value); depth += 1) {
    value = (value as { data?: unknown }).data;
  }
  return Array.isArray(value) ? value as Record<string, unknown>[] : [];
};

const getLookupValue = (record: Record<string, unknown>, keys: string[]) => {
  const normalized = new Map(Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]));
  return keys.map((key) => normalized.get(key.toLowerCase())).find((value) => value !== undefined && value !== null && value !== '');
};

const makeLookup = (payload: unknown, idKeys: string[], nameKeys: string[]) => Object.fromEntries(
  lookupRecords(payload).flatMap((record) => {
    const id = getLookupValue(record, idKeys);
    const name = getLookupValue(record, nameKeys);
    return id != null && name != null ? [[String(id), String(name)]] : [];
  }),
);

const fetchLookup = async (path: string, idKeys: string[], nameKeys: string[]) => {
  try {
    const response = await api.get<unknown>(path);
    return makeLookup(response.data, idKeys, nameKeys);
  } catch {
    return emptyLookup();
  }
};

export type ActivityProfile = {
  ActivityProfileId: number;
  ActivityId: number;
  Area: number;
  UnitId: number;
  ActivityTypeId: number;
  SeasonId?: number | null;
  PerennialValue?: string | null;
  LandTypeId: number;
  CreatedDate: string;
  ActivityName?: string;
  UnitName?: string;
  ActivityTypeName?: string;
  SeasonName?: string | null;
  LandTypeName?: string;
};

export type IncomeProfile = {
  IncomeProfileId: number;
  ActivityProfileId: number;
  TotalIncomeLastYear: number;
  PresentMonthIncome: number;
  FutureProjection: number;
  Month1Income: number;
  Month2Income: number;
  Month3Income: number;
  Month4Income: number;
  Month5Income: number;
  Month6Income: number;
  CreatedDate: string;
};

export type InvestmentProfile = {
  InvestmentProfileId: number;
  SHGMemberId: number;
  TotalInvestment: number;
  LoanFromSHG: number;
  LoanFromBank: number;
  IndividualFinancing: number;
  OwnContribution: number;
  CSR: number;
  GovernmentGrant: number;
  OtherSource: number;
  CreatedDate: string;
};

export type TechnicalSupport = {
  TechnicalSupportId: number;
  SHGMemberId: number;
  HasSkillTraining: boolean;
  SkillTradeId: number | null;
  SkillTrainingDate?: string | null;
  SkillAgencyId: number | null;
  HasEDPTraining: boolean;
  EDPTradeId: number | null;
  EDPTrainingDate?: string | null;
  EDPAagencyId: number | null;
  TrainingRequired: boolean;
  RequiredTradeId: number | null;
  CreatedDate: string;
  SkillTrade?: string | null;
  EDPTrade?: string | null;
  RequiredTrade?: string | null;
  SkillAgency?: string | null;
  EDPAagency?: string | null;
};

export type FinancialSupport = {
  FinancialSupportId: number;
  SHGMemberId: number;
  ActivityId: number | null;
  IsFinancialSupportRequired: boolean;
  LoanCycleId?: number | null;
  CreatedDate: string;
  ActivityName?: string | null;
  CycleName?: string | null;
};

export type LoanProjection = {
  Activity?: unknown;
  Cycle?: unknown;
  LoanAmount: number;
  TenureMonths: number;
  ROI: number;
  InterestAmount: number;
  TotalRepayable: number;
  MonthlyInstallment: number;
};

export type FullDetailReport = {
  SHGMemberId: number;
  FinancialSupport: FinancialSupport[];
  TechnicalSupport: TechnicalSupport[];
  SHGTracking: SHGTrackingRecord[];
  ActivityProfile: ActivityProfile[];
  IncomeProfile: IncomeProfile[];
  InvestmentProfile: InvestmentProfile[];
};

type FullDetailReportResponse = FullDetailReport | {
  success?: boolean;
  message?: string;
  data: FullDetailReport;
};

const unwrapList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const wrapped = payload as { data?: unknown } | null;
  return Array.isArray(wrapped?.data) ? (wrapped.data as T[]) : [];
};

export const memberProfileService = {
  getDisplayLookups: (): Promise<MemberDisplayLookups> => {
    if (!memberDisplayLookupsPromise) {
      memberDisplayLookupsPromise = Promise.all([
        fetchLookup('/activity', ['ActivityId', 'Id', 'id'], ['ActivityName', 'Name', 'name']),
        fetchLookup('/activity-type/get-all', ['ActivityTypeId', 'Id', 'id'], ['ActivityTypeName', 'TypeName', 'Name', 'name']),
        fetchLookup('/unit-of-area/get-all', ['UnitId', 'UnitOfAreaId', 'Id', 'id'], ['UnitName', 'UnitOfAreaName', 'Name', 'name']),
        fetchLookup('/season/get-all', ['SeasonId', 'Id', 'id'], ['SeasonName', 'Name', 'name']),
        fetchLookup('/Land-type/get-all', ['LandTypeId', 'Id', 'id'], ['LandTypeName', 'Name', 'name']),
        fetchLookup('/trade/get-all', ['TradeId', 'Id', 'id'], ['TradeName', 'Name', 'name']),
        fetchLookup('/training-agency/get-all', ['TrainingAgencyId', 'AgencyId', 'Id', 'id'], ['TrainingAgencyName', 'AgencyName', 'Name', 'name']),
      ]).then(([activities, activityTypes, units, seasons, landTypes, trades, agencies]) => ({
        activities, activityTypes, units, seasons, landTypes, trades, agencies,
      }));
    }
    return memberDisplayLookupsPromise;
  },

  /**
   * Single consolidated call — returns this member's Financial/Technical
   * support, SHG Tracking, Activity/Income/Investment profiles all scoped
   * server-side to the given SHGMemberId.
   */
  getFullDetailReport: async (shgMemberId: number): Promise<FullDetailReport> => {
    const response = await api.get<FullDetailReportResponse>(`/shg-tracking/get-full-detail-report/${shgMemberId}`);
    const payload = response.data;
    const wrappedData = (payload as { data?: FullDetailReport }).data;
    return wrappedData ?? payload as FullDetailReport;
  },

  /**
   * Unfiltered Activity Profile list — used only to enrich the full detail
   * report's Activity Profile rows with friendly names (activity/unit/season/
   * land type), since the per-member report only returns raw ids.
   */
  getActivityProfiles: async (): Promise<ActivityProfile[]> => {
    const response = await api.get('/activity-profile/get-all');
    return unwrapList<ActivityProfile>(response.data);
  },

  getLoanProjection: async (activityId: number, loanCycleId: number): Promise<LoanProjection> => {
    const response = await api.get<LoanProjection>('/financial-support/loan-projection', {
      params: { activityId, loanCycleId },
    });
    return response.data;
  },
};
