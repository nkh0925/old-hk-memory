import Constants from 'expo-constants';
import { Platform } from 'react-native';

/* =======================
   API
======================= */

// 使用 Expo 的推荐方式读取环境变量（更可靠）
const getApiBaseUrl = (): string => {
  const expoApiUrl =
    Constants.expoConfig?.extra?.apiBaseUrl ||
    Constants.manifest?.extra?.apiBaseUrl;

  if (expoApiUrl) {
    const cleanUrl = expoApiUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;  }

  // 开发环境真机调试必须用这个局域网 IP
  return Platform.OS === 'android'
    ? 'http://192.168.2.18:3000/api/v1'   
    : 'http://localhost:3000/api/v1';
};

export const API_BASE_URL: string = getApiBaseUrl();
/* =======================
   Storage
======================= */

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
} as const;

/* =======================
   Error Codes
======================= */

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

/* =======================
   Map Configuration
======================= */

export const MAP_CONFIG = {
  defaultRegion: {
    latitude: 22.3193,
    longitude: 114.1694,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  },
  defaultZoom: 13,
} as const;

/* =======================
   Photo Configuration
======================= */

export const PHOTO_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/* =======================
   AR Configuration
======================= */

export const AR_CONFIG = {
  triggerRadius: 50, // meters
} as const;
