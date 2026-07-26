// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL should be defined in .env (e.g., REACT_NATIVE_API_URL)
const BASE_URL = process.env.REACT_NATIVE_API_URL || 'http://localhost:3000';

// Create Axios instance
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 seconds timeout
});

/**
 * Helper to get stored access token.
 */
const getAccessToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        return token;
    } catch {
        return null;
    }
};

/**
 * Helper to get stored refresh token.
 */
const getRefreshToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem('refreshToken');
        return token;
    } catch {
        return null;
    }
};

/**
 * Store new tokens after refresh.
 */
const storeTokens = async (access: string, refresh: string) => {
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
};

// Request interceptor – attach Authorization header
api.interceptors.request.use(async (config: any) => {
    const token = await getAccessToken();
    if (token) {
        config.headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

// Response interceptor – handle 401 and retry after token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = await getRefreshToken();
            if (refreshToken) {
                try {
                    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
                    const { accessToken: newAccess, refreshToken: newRefresh } = refreshResponse.data;
                    await storeTokens(newAccess, newRefresh);
                    // Update Authorization header and retry original request
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed – propagate original error
                    return Promise.reject(error);
                }
            }
        }
        // For other errors or if retry already attempted, reject
        return Promise.reject(error);
    }
);

export default api;
