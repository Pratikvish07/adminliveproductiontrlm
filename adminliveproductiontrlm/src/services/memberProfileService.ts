import api from './api';
import type { SHGTrackingRecord } from './reportService';

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

const unwrapList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const wrapped = payload as { data?: unknown } | null;
  return Array.isArray(wrapped?.data) ? (wrapped.data as T[]) : [];
};

export const memberProfileService = {
  /**
   * Single consolidated call — returns this member's Financial/Technical
   * support, SHG Tracking, Activity/Income/Investment profiles all scoped
   * server-side to the given SHGMemberId.
   */
  getFullDetailReport: async (shgMemberId: number): Promise<FullDetailReport> => {
    const response = await api.get<FullDetailReport>(`/shg-tracking/get-full-detail-report/${shgMemberId}`);
    return response.data;
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
