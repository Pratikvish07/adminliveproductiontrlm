import type { User } from '../types/auth.types';

export const AUTH_STORAGE_KEY = 'trlm_auth_user';
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_ROLE_KEY = 'role';
export const AUTH_UNAUTHORIZED_EVENT = 'trlm:auth-unauthorized';

export const getStoredUser = (): User | null => {
  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) as User : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const getStoredToken = (): string => localStorage.getItem(AUTH_TOKEN_KEY) ?? '';

export const setStoredUser = (user: User): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const setStoredRole = (role: string): void => {
  localStorage.setItem(AUTH_ROLE_KEY, role);
};

export const clearAuthStorage = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
};

export const dispatchUnauthorizedEvent = (): void => {
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
};
