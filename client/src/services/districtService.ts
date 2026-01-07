/**
 * District Service
 * Handles district-related API operations
 */

import api from './api';
import type { District } from '../types/district';

/**
 * API response structure for district list
 */
interface DistrictListResponse {
  success: boolean;
  message?: string;
  data: {
    count: number;
    districts: District[];
  };
}

/**
 * Service for district-related API operations
 */
class DistrictService {
  /**
   * Fetches all districts from the API
   */
  async getDistricts(): Promise<District[]> {
    try {
      const response = await api.post<DistrictListResponse>('/districts/list', {});
      
      console.log('=== DISTRICT SERVICE DEBUG ===');
      console.log('response.data.data.districts:', response.data?.data?.districts);
      console.log('==============================');
      
      if (!response.data?.success) {
        throw new Error('Failed to fetch districts: API returned unsuccessful response');
      }
      
      return response.data.data.districts;
    } catch (error) {
      console.error('DistrictService.getDistricts error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch districts: ${error.message}`);
      }
      throw new Error('Failed to fetch districts: Unknown error occurred');
    }
  }
}

export const districtService = new DistrictService();
export default districtService;
