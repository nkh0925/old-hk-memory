/**
 * User service
 * Handles user-related API operations
 */

import api from './api';
import type { Photo, Pagination } from '../types';

/**
 * Params for fetching user's photos
 */
interface GetMyPhotosParams {
  page?: number;
  limit?: number;
}

/**
 * Response for user's photos
 */
interface GetMyPhotosResponse {
  data: Photo[];
  pagination: Pagination;
}

/**
 * User service object
 */
export const userService = {
  /**
   * Get current user's uploaded photos
   */
  async getMyPhotos(params: GetMyPhotosParams = {}): Promise<GetMyPhotosResponse> {
    const { page = 1, limit = 20 } = params;

    try {
      // 使用 /photos/my 端点
      const response = await api.post('/photos/my', { page, limit });

      console.log('=== USER SERVICE getMyPhotos DEBUG ===');
      console.log('response.data:', JSON.stringify(response.data, null, 2));
      console.log('======================================');

      // Handle { success: true, data: [...], pagination: {...} }
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return {
          data: response.data.data,
          pagination: response.data.pagination || {
            page,
            limit,
            total: response.data.data.length,
            totalPages: 1,
          },
        };
      }

      // Handle { data: [...], pagination: {...} }
      if (Array.isArray(response.data?.data)) {
        return {
          data: response.data.data,
          pagination: response.data.pagination || {
            page,
            limit,
            total: response.data.data.length,
            totalPages: 1,
          },
        };
      }

      // Handle direct array response
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            page,
            limit,
            total: response.data.length,
            totalPages: 1,
          },
        };
      }

      console.error('Unexpected response format:', response.data);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      };
    } catch (error) {
      console.error('UserService.getMyPhotos error:', error);
      throw error;
    }
  },
};

export default userService;
