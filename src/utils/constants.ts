// App constants

export const APP_NAME = 'TRLM Dashboard';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CRP: 'crp',
  SUPER_ADMIN: 'super_admin',
} as const;

export const MODULES = {
  MASTER: 'master',
  STAFF: 'staff',
  SHG: 'shg',
  CRP: 'crp',
  PAYMENT: 'payment',
} as const;

