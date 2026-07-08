import { Platform } from 'react-native';
import {
  enqueueOfflineMutation,
  readOfflineQueue,
  readOfflineValue,
  removeOfflineValuesByPrefix,
  replaceOfflineQueue,
  writeOfflineValue,
} from './offline-store';
import { appConfig } from './config';

const TOKEN_KEY = 'healthclan.apiToken';
let memoryToken: string | null = null;

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
  cacheKey?: string;
  offlineQueue?: boolean;
  invalidates?: string[];
};

type ApiError = Error & { fromServer?: boolean };
type AccountType = 'patient' | 'doctor' | 'care_agency' | 'admin';

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /network request failed|unable to resolve host|getaddrinfo|enotfound|failed to fetch|load failed|java\.io\.ioexception/i.test(message);
}

function getNetworkErrorMessage() {
  return 'HealthClan is having trouble reaching the server. Please try again shortly.';
}

function getApiErrorMessage(payload: any) {
  const validationMessage = Array.isArray(payload?.errors)
    ? payload.errors
        .map((error: any) => error?.msg)
        .filter(Boolean)
        .join(' ')
    : '';

  return validationMessage || payload?.message || 'HealthClan API request failed';
}

export function invalidateApiCache(paths: string[]) {
  removeOfflineValuesByPrefix(paths.map(path => `api-cache:${path}`));
}

export function getApiToken() {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }

  return memoryToken;
}

function readToken() {
  return getApiToken();
}

export function setApiToken(token: string | null) {
  if (Platform.OS !== 'web') {
    memoryToken = token;
    return;
  }

  try {
    if (token) {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    }
  } catch {
    return;
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = options.token ?? readToken();
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = options.cacheKey || (method === 'GET' ? `api-cache:${path}` : undefined);

  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    let response: Response | null = null;
    let lastNetworkError: unknown = null;

    for (const baseUrl of appConfig.apiBaseUrls) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), appConfig.apiTimeoutMs);

      try {
        response = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
        break;
      } catch (error) {
        lastNetworkError = error;
        if ((error as Error).name === 'AbortError' || !isNetworkError(error)) {
          throw error;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!response) {
      throw lastNetworkError instanceof Error ? lastNetworkError : new Error(getNetworkErrorMessage());
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
      const error = new Error(getApiErrorMessage(payload)) as ApiError;
      error.fromServer = true;
      throw error;
    }

    if (cacheKey) writeOfflineValue(cacheKey, payload?.data);
    if (method !== 'GET' && options.invalidates?.length) {
      invalidateApiCache(options.invalidates);
    }
    return payload?.data as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('HealthClan is taking too long to respond. Please try again shortly.');
    }

    if ((error as ApiError).fromServer) throw error;

    const cached = cacheKey ? readOfflineValue<T>(cacheKey) : null;
    if (cached !== null) return cached;

    if (method !== 'GET' && options.offlineQueue !== false) {
      const queued = enqueueOfflineMutation({ path, method, body: options.body });
      return { offlineQueued: true, queued } as T;
    }

    if (isNetworkError(error)) {
      throw new Error(getNetworkErrorMessage());
    }

    throw error;
  }
}

export async function flushOfflineQueue() {
  const queue = readOfflineQueue();
  const failed = [];
  let published = 0;

  for (const mutation of queue) {
    try {
      await apiRequest(mutation.path, {
        method: mutation.method,
        body: mutation.body,
        offlineQueue: false,
      });
      published += 1;
    } catch {
      failed.push(mutation);
    }
  }

  replaceOfflineQueue(failed);
  if (published > 0) removeOfflineValuesByPrefix(['api-cache:']);
  return { attempted: queue.length, remaining: failed.length };
}

export const healthclanApi = {
  auth: {
    login: (body: { email?: string; phone?: string; password: string; type?: AccountType }) =>
      apiRequest<{ token: string; user: unknown }>('/auth/login', {
        method: 'POST',
        body: { type: 'patient', ...body },
        offlineQueue: false,
      }),
    register: (body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      countryCode?: string;
      dateOfBirth?: string;
      maritalStatus?: string;
      address?: Record<string, unknown>;
      password: string;
      type: AccountType;
    }) =>
      apiRequest<{ token: string; user: unknown }>('/auth/register', {
        method: 'POST',
        body,
        offlineQueue: false,
      }),
    forgotPassword: (email: string, type: AccountType = 'patient') =>
      apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { email, type },
        offlineQueue: false,
      }),
    verifyEmail: (token: string, type: AccountType = 'patient') =>
      apiRequest(`/auth/verify-email/${encodeURIComponent(token)}?type=${encodeURIComponent(type)}`, {
        method: 'GET',
        offlineQueue: false,
      }),
    resendVerificationEmail: (token?: string | null) =>
      apiRequest('/auth/resend-verification-email', {
        method: 'POST',
        token,
        offlineQueue: false,
      }),
  },
  users: {
    me: () => apiRequest<{ user: unknown; profile: unknown }>('/users/me'),
    updateMe: (body: Record<string, unknown>) =>
      apiRequest('/users/me', { method: 'PATCH', body, invalidates: ['/users/me'] }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiRequest('/users/password', { method: 'PATCH', body }),
    favorites: () => apiRequest<any[]>('/users/favorites/doctors'),
    addFavorite: (doctorId: string) =>
      apiRequest(`/users/favorites/doctors/${doctorId}`, {
        method: 'POST',
        invalidates: ['/users/favorites/doctors', '/doctors'],
      }),
    removeFavorite: (doctorId: string) =>
      apiRequest(`/users/favorites/doctors/${doctorId}`, {
        method: 'DELETE',
        invalidates: ['/users/favorites/doctors', '/doctors'],
      }),
    preferences: () => apiRequest<Record<string, unknown>>('/users/preferences'),
    updatePreferences: (body: Record<string, unknown>) =>
      apiRequest('/users/preferences', { method: 'PUT', body, invalidates: ['/users/preferences'] }),
    trustedDevices: () => apiRequest<any[]>('/users/trusted-devices'),
    upsertTrustedDevice: (body: { deviceId: string; name: string; platform?: string; pushToken?: string; isTrusted?: boolean }) =>
      apiRequest('/users/trusted-devices', { method: 'POST', body, invalidates: ['/users/trusted-devices'] }),
    removeTrustedDevice: (id: string) =>
      apiRequest(`/users/trusted-devices/${id}`, { method: 'DELETE', invalidates: ['/users/trusted-devices'] }),
    supportTickets: () => apiRequest<any[]>('/users/support-tickets'),
    createSupportTicket: (body: { subject: string; message: string; category?: string }) =>
      apiRequest('/users/support-tickets', { method: 'POST', body, invalidates: ['/users/support-tickets'] }),
  },
  doctors: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value));
      });
      const suffix = query.toString() ? `?${query}` : '';
      return apiRequest<any[]>(`/doctors${suffix}`);
    },
    search: (params: Record<string, string | number | undefined> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value));
      });
      const suffix = query.toString() ? `?${query}` : '';
      return apiRequest<any[]>(`/doctors/search${suffix}`);
    },
    specialties: () => apiRequest<any[]>('/doctors/specialties'),
    byId: (id: string) => apiRequest<any>(`/doctors/${id}`),
    availability: (id: string) => apiRequest<any>(`/doctors/${id}/availability`),
    bookAppointment: (body: Record<string, unknown>) =>
      apiRequest('/doctors/appointments', {
        method: 'POST',
        body,
        offlineQueue: false,
        invalidates: ['/doctors/appointments', '/doctors', '/notifications'],
      }),
    appointments: (params: { date?: string; startDate?: string; endDate?: string } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const suffix = query.toString() ? `?${query}` : '';
      return apiRequest<any[]>(`/doctors/appointments/me${suffix}`);
    },
    appointment: (id: string) => apiRequest<any>(`/doctors/appointments/${id}`),
    joinAppointment: (id: string) =>
      apiRequest<{ roomId: string; token: string; expiresAt?: string }>(`/doctors/appointments/${id}/join`, {
        method: 'POST',
        invalidates: ['/doctors/appointments', '/notifications'],
      }),
    notes: (id: string) => apiRequest<any>(`/doctors/appointments/${id}/notes`),
  },
  care: {
    createRequest: (body: Record<string, unknown>) =>
      apiRequest('/care/requests', {
        method: 'POST',
        body,
        offlineQueue: false,
        invalidates: ['/care/requests', '/notifications'],
      }),
    myRequests: () => apiRequest<any[]>('/care/requests/me'),
  },
  payments: {
    cards: () => apiRequest<any[]>('/payments/cards'),
    createCardSetupIntent: () =>
      apiRequest<{ setupIntentId?: string; clientSecret: string }>('/payments/cards/setup-intent', {
        method: 'POST',
        offlineQueue: false,
      }),
    saveCard: (body: Record<string, unknown>) =>
      apiRequest('/payments/cards', {
        method: 'POST',
        body,
        offlineQueue: false,
        invalidates: ['/payments/cards', '/notifications'],
      }),
    setDefaultCard: (id: string) =>
      apiRequest(`/payments/cards/${id}/default`, { method: 'PATCH', invalidates: ['/payments/cards'] }),
    chargeSavedCard: (body: Record<string, unknown>) =>
      apiRequest('/payments/cards/charge', {
        method: 'POST',
        body,
        offlineQueue: false,
        invalidates: ['/payments', '/doctors/appointments', '/notifications'],
      }),
  },
  notifications: {
    list: () => apiRequest<any[]>('/notifications'),
    markRead: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH', invalidates: ['/notifications'] }),
    markAllRead: () => apiRequest('/notifications/read-all', { method: 'PATCH', invalidates: ['/notifications'] }),
    delete: (id: string) =>
      apiRequest(`/notifications/${id}`, { method: 'DELETE', invalidates: ['/notifications'] }),
  },
  reviews: {
    create: (body: { target: string; rating: number; type: 'doctor' | 'care_agency'; appointment?: string; careRequest?: string; comment?: string }) =>
      apiRequest('/reviews', { method: 'POST', body, invalidates: ['/reviews', '/doctors/appointments'] }),
    forUser: (userId: string) => apiRequest<any[]>(`/reviews/${userId}`),
  },
};
