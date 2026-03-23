import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001/api',
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setToken(token: string | null) {
  accessToken = token;

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((response) => {
        const nextToken = response.data?.token || null;
        setToken(nextToken);
        return nextToken;
      })
      .catch(() => {
        setToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextToken}`;

    return api(originalRequest);
  }
);

export async function restoreSession() {
  const response = await api.post('/auth/refresh');
  const nextToken = response.data?.token || null;
  if (nextToken) {
    setToken(nextToken);
  }
  return response.data;
}

export async function logoutRequest() {
  try {
    await api.post('/auth/logout');
  } finally {
    setToken(null);
  }
}
