import axios from 'axios';
import { Platform } from 'react-native';

import Constants from 'expo-constants';
import TokenManager from '../services/TokenManager';

// For Android emulator, localhost resolves to 10.0.2.2.
// For Web or iOS simulator, localhost resolves to 127.0.0.1 (or localhost).
// For physical devices, we dynamically grab the Expo host IP!
export const getBaseUrl = () => {
    // If running in Expo Go on a physical device, grab the computer's local IP dynamically
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
        let ipString = debuggerHost.split(':')[0]; // extracts like 192.168.1.15
        // If the debugger resolves to localhost in an Android Emulator, map to the host alias
        if ((ipString === '127.0.0.1' || ipString === 'localhost') && Platform.OS === 'android') {
            ipString = '10.0.2.2';
        }
        return `http://${ipString}:5000`;
    }

    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000';
    }
    // Hardcode 127.0.0.1 instead of localhost to bypass strict browser HSTS policies on Web!
    return 'http://127.0.0.1:5000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    try {
        const token = await TokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        // ignore
    }
    return config;
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
