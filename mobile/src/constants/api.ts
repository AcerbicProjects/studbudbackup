// mobile/src/constants/api.ts
import { getBaseUrl } from '../lib/api';

// Export a constant that resolves to the correct base URL for the backend.
// This will work for web, Android emulator, iOS simulator, and physical devices.
export const API_URL = getBaseUrl();
