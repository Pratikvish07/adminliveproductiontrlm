// Auth related types

export interface LoginRequest {
  email?: string;
  livelihoodTrackerId?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    role: string;
  };
}

export interface SignupRequest {
  districtName: string;
  blockName: string;
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
  email: string;
  name: string;
  role: string;
}

