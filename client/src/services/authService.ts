/**
 * Authentication service
 * Handles user registration, login, and profile management
 */

import api from './api';
import type { User } from '../types';

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
 * Helper to extract user from API response
 * Handles multiple response formats
 */
function extractUser(responseData: any): User {
  // Case 1: { success: true, data: { user: {...} } }
  if (responseData?.data?.user?.id) {
    return responseData.data.user as User;
  }
  // Case 2: { success: true, data: {...} } where data IS the user
  if (responseData?.data?.id && responseData?.data?.email) {
    return responseData.data as User;
  }
  // Case 3: { user: {...} }
  if (responseData?.user?.id) {
    return responseData.user as User;
  }
  // Case 4: Direct user object
  if (responseData?.id && responseData?.email) {
    return responseData as User;
  }
  
  console.error('Unable to extract user from:', responseData);
  throw new Error('Invalid response: unable to extract user data');
}

/**
 * Helper to extract auth response (user + token)
 */
function extractAuthResponse(responseData: any): AuthResponse {
  let user: User;
  let token: string;

  // Extract from { success: true, data: { user, token } }
  if (responseData?.data?.token && responseData?.data?.user) {
    token = responseData.data.token;
    user = responseData.data.user;
  }
  // Extract from { user, token }
  else if (responseData?.token && responseData?.user) {
    token = responseData.token;
    user = responseData.user;
  }
  else {
    console.error('Unable to extract auth response from:', responseData);
    throw new Error('Invalid response: missing token or user');
  }

  return { user, token };
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
    
    console.log('Register response.data:', JSON.stringify(response.data, null, 2));
    
    return extractAuthResponse(response.data);
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
    
    console.log('Login response.data:', JSON.stringify(response.data, null, 2));
    
    return extractAuthResponse(response.data);
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
    
    const user = extractUser(response.data);
    
    console.log('GetMe extracted user:', JSON.stringify(user, null, 2));
    
    return user;
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
    
    console.log('UpdateProfile response.data:', JSON.stringify(response.data, null, 2));
    
    return extractUser(response.data);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    throw error;
  }
}
