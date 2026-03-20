// Auth related types

export interface LoginRequest {
  email?: string;
  livelihoodTrackerId?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id?: string | number;
  staffId?: string | number;
  livelihoodTrackerId?: string;
  role?: string;
  roleId?: string | number;
  districtId?: string | number;
  blockId?: string | number;
  user?: {
    id: string;
    staffId?: string | number;
    livelihoodTrackerId?: string;
    email?: string;
    name?: string;
    role: string;
    roleId?: string | number;
    districtId?: string | number;
    blockId?: string | number;
    districtName?: string;
    blockName?: string;
  };
}

export interface SignupRequest {
  districtName: string;
  blockName: string | null;
  officialName: string;
  contactNumber: string;
  officialEmail: string;
  designation: string;
  livelihoodTrackerId: string;
  password: string;
  role: string;
}

export interface User {
  id: string;
  staffId?: string;
  livelihoodTrackerId?: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  districtId?: string;
  blockId?: string;
  districtName?: string;
  blockName?: string;
}

