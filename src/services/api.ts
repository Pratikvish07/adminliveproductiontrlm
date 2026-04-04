import axios from 'axios';
import {
  clearAuthStorage,
  dispatchUnauthorizedEvent,
  getStoredToken,
} from '../utils/authStorage';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 45000);
const getNormalizedUrl = (url: unknown): string => (typeof url === 'string' ? url : '');
const isPublicAuthRoute = (url: string): boolean => url === '/admin/login' || url === '/admin/signup';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const normalizedUrl = getNormalizedUrl(config.url);

  if (isPublicAuthRoute(normalizedUrl)) {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  }

  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const normalizedUrl = getNormalizedUrl(error?.config?.url);

    if (status === 401 && !isPublicAuthRoute(normalizedUrl)) {
      clearAuthStorage();
      dispatchUnauthorizedEvent();
    }

    return Promise.reject(error);
  },
);

export default api;

