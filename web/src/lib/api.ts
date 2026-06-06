const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401 && token) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryJson = await retryRes.json();
        if (retryRes.ok) return retryJson.data;
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.location.href = '/auth';
    }
    throw new Error(json.message || 'Erreur serveur');
  }

  return json.data;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json();
    if (res.ok && json.data?.accessToken) {
      localStorage.setItem('accessToken', json.data.accessToken);
      return true;
    }
  } catch {}
  return false;
}

export const auth = {
  login: (login: string, motDePasse: string) =>
    request<{ accessToken: string; refreshToken: string; user: import('@/types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, motDePasse }),
    }),
  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  changePassword: (motDePasseActuel: string, nouveauMotDePasse: string, confirmation: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse, confirmation }),
    }),
  logout: (refreshToken: string) =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

export const users = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('@/types').User[]>(`/users${query}`);
  },
  get: (id: string) => request<import('@/types').User>(`/users/${id}`),
  create: (data: Partial<import('@/types').User>) =>
    request<import('@/types').User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<import('@/types').User>) =>
    request<import('@/types').User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
  reactivate: (id: string) =>
    request<import('@/types').User>(`/users/${id}/reactivate`, { method: 'PATCH' }),
  resetPassword: (id: string) =>
    request<{ message: string; temporaryPassword: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
};

export const prospects = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('@/types').Prospect[]>(`/prospects${query}`);
  },
  get: (id: string) => request<import('@/types').Prospect>(`/prospects/${id}`),
  create: (data: Partial<import('@/types').Prospect>) =>
    request<import('@/types').Prospect>('/prospects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<import('@/types').Prospect>) =>
    request<import('@/types').Prospect>(`/prospects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  archive: (id: string) =>
    request<import('@/types').Prospect>(`/prospects/${id}/archive`, { method: 'PATCH' }),
  unarchive: (id: string) =>
    request<import('@/types').Prospect>(`/prospects/${id}/unarchive`, { method: 'PATCH' }),
  getTypeConfigs: () => request<import('@/types').ProspectTypeConfig[]>('/prospects/types/config'),
  updateTypeConfig: (type: string, data: { rayonPresence?: number; pauseStart?: string; pauseEnd?: string }) =>
    request<import('@/types').ProspectTypeConfig>(`/prospects/types/config/${type}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const calibrations = {
  calibrate: (prospectId: string, latitude: number, longitude: number) =>
    request<import('@/types').Calibration>('/calibration', {
      method: 'POST',
      body: JSON.stringify({ prospectId, latitude, longitude }),
    }),
  getByProspect: (prospectId: string) =>
    request<import('@/types').Calibration[]>(`/calibration/prospect/${prospectId}`),
  getMy: () => request<import('@/types').Calibration[]>('/calibration/my'),
};

export const visits = {
  list: (params?: string) => request<import('@/types').Visit[]>(`/visits${params ? `?${params}` : ''}`),
  get: (id: string) => request<import('@/types').Visit>(`/visits/${id}`),
  getByDelegate: (delegueId: string) => request<import('@/types').Visit[]>(`/visits/delegate/${delegueId}`),
  getByProspect: (prospectId: string) => request<import('@/types').Visit[]>(`/visits/prospect/${prospectId}`),
  getActive: (delegueId: string) => request<import('@/types').Visit | null>(`/visits/active/${delegueId}`),
  updateNotes: (id: string, notes: string) =>
    request<import('@/types').Visit>(`/visits/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),
};

function toQuery(params?: string | Record<string, string>): string {
  if (!params) return '';
  if (typeof params === 'string') return `?${params}`;
  const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v));
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
}

export const analytics = {
  getDashboard: (params?: string | Record<string, string>) =>
    request<import('@/types').DashboardAnalytics>(`/analytics/dashboard${toQuery(params)}`),
  getByDelegate: (delegueId: string, params?: string | Record<string, string>) =>
    request<any>(`/analytics/delegate/${delegueId}${toQuery(params)}`),
  getAnomalies: (params?: string | Record<string, string>) =>
    request<import('@/types').Anomaly[]>(`/analytics/anomalies${toQuery(params)}`),
};

export const pdf = {
  generate: (delegateId: string, dateFrom: string, dateTo: string) =>
    request<{ filename: string }>('/pdf/generate', {
      method: 'POST',
      body: JSON.stringify({ delegateId, dateFrom, dateTo }),
    }),
  download: (filename: string) => `${API_BASE}/pdf/download/${filename}`,
  list: () => request<import('@/types').PdfReport[]>('/pdf/list'),
};

export const audit = {
  list: (params?: string) =>
    request<import('@/types').AuditLog[]>(`/audit/logs${params ? `?${params}` : ''}`),
  getLogs: (params?: string) =>
    request<import('@/types').AuditLog[]>(`/audit/logs${params ? `?${params}` : ''}`),
  get: (id: string) => request<import('@/types').AuditLog>(`/audit/logs/${id}`),
};
