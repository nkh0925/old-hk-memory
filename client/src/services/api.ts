/**
 * Axios API client configuration
 * Handles request/response interceptors and error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { API_BASE_URL, ERROR_CODES } from '../utils/constants';
import { getToken } from '../utils/storage';
import type { ApiError } from '../types';

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiException';
    this.code = code;
    this.status = status;
  }
}

/**
 * Create and configure the Axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Attaches Bearer token from secure storage to all requests
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to attach token to request:', error);
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Extracts data from successful responses and handles errors
 */
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Return the full response for successful requests
    return response;
  },
  (error: AxiosError<ApiError>): Promise<never> => {
    // Handle network errors
    if (!error.response) {
      const networkError = new ApiException(
        'Network error. Please check your connection.',
        ERROR_CODES.SERVER_ERROR,
        0
      );
      return Promise.reject(networkError);
    }

    // Handle API errors with structured response
    const { status, data } = error.response;

    if (data && data.error) {
      const apiError = new ApiException(
        data.error.message,
        data.error.code,
        status
      );
      return Promise.reject(apiError);
    }

    // Handle unexpected error format
    const fallbackError = new ApiException(
      'An unexpected error occurred',
      ERROR_CODES.SERVER_ERROR,
      status
    );
    return Promise.reject(fallbackError);
  }
);

export default api;
