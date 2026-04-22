import { Platform } from 'react-native';

/* =======================
   API
======================= */

// 🔧 手动切换：模拟器用 true，真机用 false
const IS_EMULATOR = true;

export const API_BASE_URL: string = (() => {
  if (IS_EMULATOR) {
    return 'http://10.0.2.2:3000/api/v1';      // ← 安卓模拟器
  }
  return 'http://192.168.0.103:3000/api/v1';    // ← 安卓真机
})();

console.log('🌐 API_BASE_URL:', API_BASE_URL);

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