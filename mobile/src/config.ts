import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  ios: 'http://localhost:5000/api',
  android: 'http://10.0.2.2:5000/api',
  default: 'http://localhost:5000/api',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;
export default {
  API_URL,
};
