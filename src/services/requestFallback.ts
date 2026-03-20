import api from './api';

const isNotFoundError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status === 404
    : false;
};

const normalizePath = (path: string): string => path.replace(/^\/api(?=\/|$)/i, '');

export const getWithFallback = async <T>(paths: string[]): Promise<T> => {
  let lastError: unknown = null;

  for (const path of Array.from(new Set(paths.map(normalizePath)))) {
    try {
      const response = await api.get<T>(path);
      return response.data;
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};
