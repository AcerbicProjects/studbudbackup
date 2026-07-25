import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sb_access_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';

// Fallback in-memory storage for web mode, since SecureStore is not supported on Web
const webMemoryStorage: Record<string, string> = {};

const isWeb = Platform.OS === 'web';

export const TokenManager = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (isWeb) {
      webMemoryStorage[ACCESS_TOKEN_KEY] = accessToken;
      webMemoryStorage[REFRESH_TOKEN_KEY] = refreshToken;
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    if (isWeb) {
      return webMemoryStorage[ACCESS_TOKEN_KEY] || null;
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return webMemoryStorage[REFRESH_TOKEN_KEY] || null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    if (isWeb) {
      delete webMemoryStorage[ACCESS_TOKEN_KEY];
      delete webMemoryStorage[REFRESH_TOKEN_KEY];
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export default TokenManager;
