// src/api/apiClient.ts
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { requestWithQueue } from './requestQueue';

/**
 * Centralized API client that routes all requests through the request queue.
 * It provides thin wrappers for the common HTTP methods.
 */
export const apiGet = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestWithQueue<T>({ ...config, method: 'GET', url });
};

export const apiPost = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestWithQueue<T>({ ...config, method: 'POST', url, data });
};

export const apiPut = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestWithQueue<T>({ ...config, method: 'PUT', url, data });
};

export const apiDelete = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestWithQueue<T>({ ...config, method: 'DELETE', url });
};
