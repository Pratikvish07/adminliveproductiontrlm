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
