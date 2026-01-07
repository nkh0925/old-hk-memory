/**
 * Secure storage wrapper for expo-secure-store
 * Handles token and user data persistence
 */

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './constants';
import type { User } from '../types';

/**
 * Retrieve the authentication token from secure storage
 * @returns The stored token or null if not found
 */
export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
    return token;
  } catch (error) {
    console.error('Failed to get token from storage:', error);
    return null;
  }
}

/**
 * Store the authentication token in secure storage
 * @param token - The JWT token to store (string or object with token property)
 */
export async function setToken(token: string | Record<string, unknown>): Promise<void> {
  try {
    // Handle case where token might be an object
    let tokenString: string;

    if (typeof token === 'string') {
      tokenString = token;
    } else if (token && typeof token === 'object') {
      // Token might be an object like { accessToken: "...", token: "..." }
      // Try common property names
      if ('accessToken' in token && typeof token.accessToken === 'string') {
        tokenString = token.accessToken;
      } else if ('access_token' in token && typeof token.access_token === 'string') {
        tokenString = token.access_token;
      } else if ('token' in token && typeof token.token === 'string') {
        tokenString = token.token;
      } else {
        // Fallback: stringify the entire object
        console.warn('Token is an object, stringifying:', token);
        tokenString = JSON.stringify(token);
      }
    } else {
      throw new Error(`Invalid token type: ${typeof token}`);
    }

    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, tokenString);
  } catch (error) {
    console.error('Failed to set token in storage:', error);
    throw error;
  }
}

/**
 * Remove the authentication token from secure storage
 */
export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Failed to remove token from storage:', error);
    throw error;
  }
}

/**
 * Retrieve the user data from secure storage
 * @returns The stored user object or null if not found
 */
export async function getUser(): Promise<User | null> {
  try {
    const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Failed to get user from storage:', error);
    return null;
  }
}

/**
 * Store the user data in secure storage
 * @param user - The user object to store
 */
export async function setUser(user: User): Promise<void> {
  try {
    if (!user || typeof user !== 'object') {
      throw new Error(`Invalid user type: ${typeof user}`);
    }
    const userJson = JSON.stringify(user);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, userJson);
  } catch (error) {
    console.error('Failed to set user in storage:', error);
    throw error;
  }
}

/**
 * Remove the user data from secure storage
 */
export async function removeUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Failed to remove user from storage:', error);
    throw error;
  }
}

/**
 * Clear all authentication-related data from secure storage
 */
export async function clearAll(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
    ]);
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}
