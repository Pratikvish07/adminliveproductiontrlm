// Master data types

export interface District {
  districtId: number;
  districtName: string;
}

export interface Block {
  BlockId: number;
  BlockName: string;
}

export interface Role {
  roleId: number;
  roleName: string;
  createdDate: string;
}

export interface Village {
  VillageId: number;
  VillageName: string;
}

export interface GramPanchayat {
  GPId: number;
  GPName: string;
}
export interface SignupBlockOption {
  blockId: number | string;
  blockName: string;
}

export interface SubCategory {
  SubCategoryId: number;
  ActivityId: number;
  SubCategoryName: string;
}

export interface LivelihoodActivity {
  ActivityId: number;
  ActivityName: string;
}

export interface Season {
  SeasonId: number;
  SeasonName: string;
}

export interface ShgLivelihood {
  LivelihoodId: number;
  MemberId: number;
  ActivityId: number;
  ActivityName: string;
  SubCategoryId: number;
  SubCategoryName: string;
  MemberName: string;
  SHGName: string;
  LH_CBO_Name: string | null;
  IsLH_CBO: boolean;
  Latitude: number | null;
  Longitude: number | null;
  RadiusValid: boolean;
  CreatedDate: string;
}

export interface Production {
  ProductionId: number;
  ProductionName: string;
}

export interface LivelihoodImage {
  ImageId: number;
  LivelihoodId: number;
  ImagePath: string;
  UploadedDate: string;
}

export interface CrpType {
  CRPTypeId: number;
  CRPTypeName: string;
  IsActive: boolean;
  CreatedDate: string;
}

export interface FinancialSupport {
  FinancialSupportId: number;
  SHGMemberId: number;
  ActivityId: number;
  IsFinancialSupportRequired: boolean;
  LoanCycleId: number | null;
  CreatedDate: string;
  ActivityName: string;
  CycleName: string | null;
}

export interface LoanProjection {
  Activity: string;
  Cycle: string;
  LoanAmount: number;
  TenureMonths: number;
  ROI: number;
  InterestAmount: number;
  TotalRepayable: number;
  MonthlyInstallment: number;
}

export interface IncomeProfile {
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
}

export interface LandType {
  LandTypeId: number;
  LandTypeName: string;
}
