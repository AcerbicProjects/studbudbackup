// src/api/requestQueue.ts
import api from './axiosInstance';
import NetInfo from '@react-native-community/netinfo';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

type QueueItem<T = any> = {
    config: AxiosRequestConfig;
    resolve: (value: AxiosResponse<T>) => void;
    reject: (reason?: any) => void;
    retryCount: number;
};

class RequestQueue {
    private queue: QueueItem[] = [];
    private processing = false;
    private isOnline = true;

    constructor() {
        // Subscribe to network changes
        NetInfo.addEventListener(state => {
            this.isOnline = state.isConnected ?? false;
            if (this.isOnline) {
                this.processQueue();
            }
        });
    }

    enqueue<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return new Promise<AxiosResponse<T>>((resolve, reject) => {
            const item: QueueItem<T> = { config, resolve, reject, retryCount: 0 };
            this.queue.push(item);
            if (this.isOnline) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.processing) return;
        this.processing = true;
        while (this.queue.length > 0 && this.isOnline) {
            const item = this.queue.shift()!;
            try {
                const response = await this.attemptRequest(item);
                item.resolve(response);
            } catch (err) {
                item.reject(err);
            }
        }
        this.processing = false;
    }

    private async attemptRequest<T>(item: QueueItem<T>): Promise<AxiosResponse<T>> {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_BASE = 500; // ms
        try {
            return await api.request<T>(item.config);
        } catch (error) {
            if (item.retryCount < MAX_RETRIES) {
                item.retryCount++;
                const delay = RETRY_DELAY_BASE * Math.pow(2, item.retryCount);
                await new Promise(res => setTimeout(res, delay));
                return this.attemptRequest(item);
            }
            throw error;
        }
    }
}

export const requestQueue = new RequestQueue();

// Helper function to use the queue directly
export const requestWithQueue = <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return requestQueue.enqueue<T>(config);
};
