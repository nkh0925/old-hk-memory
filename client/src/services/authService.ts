/**
 * Authentication service
 * Handles user registration, login, and profile management
 */

import api from './api';
import type { User, ApiResponse } from '../types';

/**
 * Auth response containing user and token
 */
interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Profile update request data
 */
interface UpdateProfileData {
  username?: string;
}

/**
 * Helper to extract data from API response
 * Handles both { data: { user, token } } and { user, token } formats
 */
function extractData<T>(responseData: any): T {
  // 如果有嵌套的 data 字段
  if (responseData?.data !== undefined) {
    return responseData.data as T;
  }
  // 直接返回数据
  return responseData as T;
}

/**
 * Register a new user account
 */
export async function register(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  try {
    const response = await api.post('/auth/register', {
      email,
      password,
      username,
    });
    
    // 调试日志
    console.log('Register response.data:', JSON.stringify(response.data, null, 2));
    
    const data = extractData<AuthResponse>(response.data);
    
    if (!data?.token || !data?.user) {
      console.error('Invalid response structure:', response.data);
      throw new Error('Invalid response: missing token or user');
    }
    
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

/**
 * Login with existing credentials
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    // 调试日志
    console.log('Login response.data:', JSON.stringify(response.data, null, 2));
    
    const data = extractData<AuthResponse>(response.data);
    
    if (!data?.token || !data?.user) {
      console.error('Invalid response structure:', response.data);
      throw new Error('Invalid response: missing token or user');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user's profile
 */
export async function getMe(): Promise<User> {
  try {
    const response = await api.post('/auth/me', {});
    
    console.log('GetMe response.data:', JSON.stringify(response.data, null, 2));
    
    const data = extractData<User>(response.data);
    
    if (!data) {
      throw new Error('Invalid response: missing user data');
    }
    
    return data;
  } catch (error) {
    console.error('GetMe error:', error);
    throw error;
  }
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: UpdateProfileData): Promise<User> {
  try {
    const response = await api.post('/auth/profile', data);
    return extractData<User>(response.data);
  } catch (error) {
    throw error;
  }
}
