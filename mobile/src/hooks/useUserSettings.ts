// src/hooks/useUserSettings.ts
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../api/apiClient';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook to fetch and cache the current user's settings.
 * Utilizes React Query with persisted cache and respects offline status.
 */
export const useUserSettings = (userId: string) => {
    const isOnline = useNetworkStatus();

    return useQuery({
        queryKey: ['settings', userId],
        queryFn: () => apiGet(`/settings/${userId}`).then(res => res.data),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: isOnline ? 2 : false, // no retries when offline
    });
};
