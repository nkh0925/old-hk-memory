/**
 * Photo service
 * Handles photo listing, details, upload, and deletion
 */

import api from './api';
import type {
  Photo,
  PhotoMarker,
  PaginatedResponse,
  ApiResponse,
} from '../types';

/**
 * Parameters for fetching photo list
 */
interface GetPhotosParams {
  district?: string;
  page?: number;
  limit?: number;
}

/**
 * Parameters for fetching nearby photos
 */
// interface GetNearbyParams {
//   lng: number;
//   lat: number;
//   radius?: number;
// }

/**
 * Nearby photo with distance information
 */
interface NearbyPhoto extends Photo {
  distance: number;
}

/**
 * Get paginated list of photos
 * @param params - Optional filters and pagination
 * @returns Paginated photo response
 */
export async function getPhotos(
  params: GetPhotosParams = {}
): Promise<PaginatedResponse<Photo>> {
  try {
    const response = await api.post<PaginatedResponse<Photo>>('/photos/list', {
      district: params.district,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get photo markers for map display
 * @param district - Optional district filter
 * @returns Array of photo markers with coordinates
 */
export async function getMapMarkers(district?: string): Promise<PhotoMarker[]> {
  try {
    const response = await api.post<ApiResponse<PhotoMarker[]>>('/photos/map', {
      district,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get photos near a specific location
 * @param lng - Longitude coordinate
 * @param lat - Latitude coordinate
 * @param radius - Search radius in meters (default: 50)
 * @returns Array of nearby photos with distance
 */
export async function getNearbyPhotos(
  lng: number,
  lat: number,
  radius?: number
): Promise<NearbyPhoto[]> {
  try {
    const response = await api.post<ApiResponse<NearbyPhoto[]>>('/photos/nearby', {
      lng,
      lat,
      radius: radius ?? 50,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get detailed information for a specific photo
 * @param id - Photo ID
 * @returns Full photo details
 */
export async function getPhotoDetail(id: string): Promise<Photo> {
  try {
    const response = await api.post<ApiResponse<Photo>>('/photos/detail', {
      id,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Upload a new photo
 * @param formData - Form data containing image and metadata
 * @returns Created photo object
 */
export async function uploadPhoto(formData: FormData): Promise<Photo> {
  try {
    const response = await api.post<ApiResponse<Photo>>('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a photo (owner only)
 * @param id - Photo ID to delete
 */
export async function deletePhoto(id: string): Promise<void> {
  try {
    await api.post<ApiResponse<{ message: string }>>('/photos/delete', {
      id,
    });
  } catch (error) {
    throw error;
  }
}
