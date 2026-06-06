import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  Prospect,
  SyncGpsEventsRequest,
  GpsEvent,
} from '../types';

const TOKEN_KEY = '@mega_token';
const REFRESH_TOKEN_KEY = '@mega_refresh_token';
const USER_KEY = '@mega_user';

let api: AxiosInstance;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

export function createApi(): AxiosInstance {
  api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  api.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );

          const { accessToken } = response.data.data;
          await AsyncStorage.setItem(TOKEN_KEY, accessToken);

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export function getApi(): AxiosInstance {
  if (!api) {
    return createApi();
  }
  return api;
}

export async function storeTokens(token: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}

export async function storeUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<any | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await getApi().post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    const response = await getApi().post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken });
    return response.data;
  },

  changePassword: async (data: { motDePasseActuel: string; nouveauMotDePasse: string; confirmation: string }): Promise<ApiResponse<null>> => {
    const response = await getApi().post<ApiResponse<null>>('/auth/change-password', data);
    return response.data;
  },
};

export const prospectsApi = {
  getList: async (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<Prospect[]>> => {
    const response = await getApi().get<ApiResponse<Prospect[]>>('/prospects', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Prospect>> => {
    const response = await getApi().get<ApiResponse<Prospect>>(`/prospects/${id}`);
    return response.data;
  },
};

export const calibrationsApi = {
  calibrate: async (data: {
    prospectId: string;
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<any>> => {
    const response = await getApi().post<ApiResponse<any>>('/calibrations', data);
    return response.data;
  },
};

export const gpsApi = {
  sendEvent: async (data: {
    latitude: number;
    longitude: number;
    precision: number;
    vitesse: number;
    altitude: number;
    evenement: string;
    horodatage: string;
    prospectId?: string;
    visitId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await getApi().post<ApiResponse<any>>('/gps/events', data);
    return response.data;
  },

  syncEvents: async (data: SyncGpsEventsRequest): Promise<ApiResponse<any>> => {
    const response = await getApi().post<ApiResponse<any>>('/gps/sync', data);
    return response.data;
  },
};

export const visitsApi = {
  getList: async (params?: { page?: number; limit?: number; prospectId?: string }): Promise<ApiResponse<any[]>> => {
    const response = await getApi().get<ApiResponse<any[]>>('/visits', { params });
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<any | null>> => {
    const response = await getApi().get<ApiResponse<any | null>>('/visits/active');
    return response.data;
  },
};
