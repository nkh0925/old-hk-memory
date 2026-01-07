/**
 * District service
 * Handles district listing and details
 */

import api from './api';
import type { District, ApiResponse } from '../types';

/**
 * Get all available districts
 * @returns Array of district objects
 */
export async function getDistricts(): Promise<District[]> {
  try {
    const response = await api.post<ApiResponse<District[]>>('/districts/list', {});
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get detailed information for a specific district
 * @param code - District code identifier
 * @returns District details
 */
export async function getDistrictDetail(code: string): Promise<District> {
  try {
    const response = await api.post<ApiResponse<District>>('/districts/detail', {
      code,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}
