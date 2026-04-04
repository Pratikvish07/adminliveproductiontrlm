import api from './api';

const isDev = import.meta.env.DEV;

const isNotFoundError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status === 404
    : false;
};

const isServerError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'response' in error
    ? ((error as { response?: { status?: number } }).response?.status ?? 0) >= 500
    : false;
};

const normalizePath = (path: string): string => path.replace(/^\/api(?=\/|$)/i, '');

export const getWithFallback = async <T>(paths: string[]): Promise<T> => {
  const normalizedPaths = Array.from(new Set(paths.map(normalizePath)));
  let lastError: unknown = null;
  const attempts: string[] = [];

  for (const path of normalizedPaths) {
    try {
      const response = await api.get<T>(path);
      return response.data;
    } catch (error) {
      lastError = error;

      const shouldTryNext = isNotFoundError(error) || isServerError(error);
      if (!shouldTryNext) {
        throw error;
      }
      attempts.push(path);
    }
  }

  if (isDev && attempts.length > 1) {
    console.info('[requestFallback] All fallback paths failed:', attempts);
  }

  throw lastError;
};
