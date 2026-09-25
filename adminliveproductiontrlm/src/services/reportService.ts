import api from './api';

export type SHGTrackingRecord = {
  TrackingId?: number;
  SHGMemberId?: number;
  SHGName?: string;
  CRPRegistrationId?: number;
  CRPName?: string;
  District?: string;
  Block?: string;
  GramPanchayat?: string;
  Village?: string;
  SHGCode?: string;
  MemberName?: string;
  MemberCategory?: string;
  ActivityName?: string;
  Seasonality?: string;
  TotalInvestment?: number;
  AnnualIncomeBefore?: number;
  AnnualIncomeAfter?: number;
  ProgressStatus?: string;
  Latitude?: number | string | null;
  Longitude?: number | string | null;
  ImagePath?: string | null;
  VideoPath?: string | null;
  GeoStatus?: string | null;
  ImageStatus?: string | null;
  VideoStatus?: string | null;
  Remarks?: string | null;
  CreatedDate?: string | null;
  CheckOutDate?: string | null;
  NextVisitDate?: string | null;
  [key: string]: unknown;
};

type SHGTrackingResponse = {
  success?: boolean;
  data?: SHGTrackingRecord[];
};

export const getSHGTrackingReports = async (): Promise<SHGTrackingRecord[]> => {
  const response = await api.get<SHGTrackingRecord[] | SHGTrackingResponse>('/shg-tracking/get-all');
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const reportService = {
  getSHGTrackingReports,
};
