import axios, { type AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight: Promise<string> | null = null;

async function getFreshAccessToken(
  authHeaderUsedByFailedRequest: string | undefined
): Promise<string> {
  const currentAuthHeader = accessToken ? `Bearer ${accessToken}` : null;

  if (accessToken && currentAuthHeader !== authHeaderUsedByFailedRequest) {
    return accessToken;
  }

  refreshInFlight ??= api.post('/auth/refresh').then((res) => {
    const token: string = res.data.data.accessToken;
    setAccessToken(token);
    return token;
  });

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function retryAPI(error: AxiosError) {
  const original = error.config as (typeof error)['config'] & { hasAlreadyRetried?: boolean };

  const tokenExpired = error.response?.status === 401;
  const eligibleForRetry = tokenExpired && !original.hasAlreadyRetried;

  if (!eligibleForRetry) {
    return Promise.reject(error);
  }
  original.hasAlreadyRetried = true;

  const staleAuthHeader =
    typeof original.headers.Authorization === 'string' ? original.headers.Authorization : undefined;

  const token = await getFreshAccessToken(staleAuthHeader);
  original.headers.Authorization = `Bearer ${token}`;
  return api(original);
}

api.interceptors.response.use((res) => res, retryAPI);
