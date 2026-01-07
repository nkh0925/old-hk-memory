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
 * Register a new user account
 * @param email - User's email address
 * @param password - User's password
 * @param username - User's display name
 * @returns User object and authentication token
 */
export async function register(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      username,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Login with existing credentials
 * @param email - User's email address
 * @param password - User's password
 * @returns User object and authentication token
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get current authenticated user's profile
 * @returns Current user object
 */
export async function getMe(): Promise<User> {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/me', {});
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update current user's profile
 * @param data - Profile fields to update
 * @returns Updated user object
 */
export async function updateProfile(data: UpdateProfileData): Promise<User> {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/profile', data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}
