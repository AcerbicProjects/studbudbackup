// src/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Hook that provides the current network connectivity status.
 * Returns a boolean `isOnline` indicating if the device has internet access.
 */
export const useNetworkStatus = (): boolean => {
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsOnline(state.isConnected ?? false);
        });
        // Get initial state
        NetInfo.fetch().then(state => setIsOnline(state.isConnected ?? false));
        return () => {
            unsubscribe();
        };
    }, []);

    return isOnline;
};
