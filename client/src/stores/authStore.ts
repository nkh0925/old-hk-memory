/**
 * Authentication store using Zustand
 * Manages user authentication state and actions
 */

import { create } from 'zustand';
import type { User } from '../types';
import {
  getToken,
  setToken,
//   removeToken,
//   getUser,
  setUser,
  clearAll,
} from '../utils/storage';
import {
  register as registerService,
  login as loginService,
  getMe,
} from '../services/authService';
import { ApiException } from '../services/api';

/**
 * Auth store state and actions interface
 */
interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar?: string }) => Promise<void>;
  clearError: () => void;
}

/**
 * Extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Auth store hook
 * Provides authentication state and actions throughout the app
 */
// export const useAuthStore = create<AuthStore>((set) => ({
//   // Initial state
//   user: null,
//   token: null,
//   isLoading: true,
//   isAuthenticated: false,
//   error: null,

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  /**
   * Initialize auth state from storage on app start
   * Validates existing token with the server
   */
  initialize: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // Retrieve stored token
      const storedToken = await getToken();

      if (!storedToken) {
        // No token found, user is not authenticated
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Token exists, validate with server
      set({ token: storedToken });

      try {
        // Fetch current user to validate token
        const user = await getMe();

        // Token is valid, update state
        await setUser(user);
        set({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (validationError) {
        // Token is invalid or expired, clear storage
        console.warn('Token validation failed:', validationError);
        await clearAll();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  /**
   * Register a new user account
   */
  register: async (
    email: string,
    password: string,
    username: string
  ): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // Call register service
      const { user, token } = await registerService(email, password, username);

      // Save to secure storage
      await setToken(token);
      await setUser(user);

      // Update state
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Login with existing credentials
   */
  login: async (email: string, password: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // Call login service
      const { user, token } = await loginService(email, password);

      // Save to secure storage
      await setToken(token);
      await setUser(user);

      // Update state
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Logout and clear all auth data
   */
  logout: async (): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      // Clear secure storage
      await clearAll();

      // Reset state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if storage clear fails, reset state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  updateProfile: async (data: { username?: string; avatar?: string }): Promise<void> => {
    try {
      set({ isLoading: true, error: null });

      const currentUser = get().user;
      if (!currentUser) throw new Error('No user logged in');

      const updatedUser: User = {
        ...currentUser,
        username: data.username || currentUser.username,
        avatar: data.avatar || currentUser.avatar,
      };

      await setUser(updatedUser);

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Clear any existing error message
   */
  clearError: (): void => {
    set({ error: null });
  },
}));
