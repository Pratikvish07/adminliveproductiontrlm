import api from './api';

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
const inflightGets = new Map<string, Promise<unknown>>();

const getOnce = async <T>(path: string): Promise<T> => {
  const existing = inflightGets.get(path) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const request = api.get<T>(path)
    .then((response) => response.data)
    .finally(() => {
      inflightGets.delete(path);
    });

  inflightGets.set(path, request as Promise<unknown>);
  return request;
};

export const getWithFallback = async <T>(paths: string[]): Promise<T> => {
  const normalizedPaths = Array.from(new Set(paths.map(normalizePath)));
  let lastError: unknown = null;

  for (const path of normalizedPaths) {
    try {
      return await getOnce<T>(path);
    } catch (error) {
      lastError = error;

      if (!isNotFoundError(error) && !isServerError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};
