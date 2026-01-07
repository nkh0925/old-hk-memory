/**
 * Photo Service
 * Handles photo-related API operations
 */

import api from './api';
import type {
  Photo,
  PhotoMarker,
  NearbyPhoto,
  PhotoDetail,
  Pagination,
  UploadPhotoParams,
  PhotoListParams,
  PhotoMapParams,
  NearbyPhotoParams,
  PhotoDetailParams,
  DeletePhotoParams,
  PhotoListResponse,
  PhotoMapResponse,
  NearbyPhotoResponse,
  PhotoDetailResponse,
  UploadPhotoResponse,
  DeletePhotoResponse,
} from '../types/photos';

/**
 * Photo Service class
 */
class PhotoService {
  /**
   * Fetch paginated photo list
   */
  async getPhotos(params: PhotoListParams = {}): Promise<{
    photos: Photo[];
    pagination: Pagination;
  }> {
    try {
      const response = await api.post<PhotoListResponse>('/photos/list', params);
      
      console.log('=== PHOTO SERVICE getPhotos DEBUG ===');
      console.log('response.data:', JSON.stringify(response.data, null, 2));
      console.log('=====================================');
      
      if (!response.data?.success) {
        throw new Error('Failed to fetch photos');
      }
      
      return {
        photos: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('PhotoService.getPhotos error:', error);
      throw error;
    }
  }

  /**
   * Fetch map markers
   */
  async getMapMarkers(params: PhotoMapParams = {}): Promise<PhotoMarker[]> {
    try {
      const response = await api.post<PhotoMapResponse>('/photos/map', params);
      
      console.log('=== PHOTO SERVICE getMapMarkers DEBUG ===');
      console.log('response.data:', JSON.stringify(response.data, null, 2));
      console.log('=========================================');
      
      if (!response.data?.success) {
        throw new Error('Failed to fetch map markers');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('PhotoService.getMapMarkers error:', error);
      throw error;
    }
  }

  /**
   * Fetch nearby photos
   */
  async getNearbyPhotos(params: NearbyPhotoParams): Promise<NearbyPhoto[]> {
    try {
      const response = await api.post<NearbyPhotoResponse>('/photos/nearby', params);
      
      if (!response.data?.success) {
        throw new Error('Failed to fetch nearby photos');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('PhotoService.getNearbyPhotos error:', error);
      throw error;
    }
  }

  /**
   * Fetch photo detail
   */
  async getPhotoDetail(params: PhotoDetailParams): Promise<PhotoDetail> {
    try {
      console.log('=== PHOTO SERVICE getPhotoDetail REQUEST ===');
      console.log('params:', params);
      
      const response = await api.post<PhotoDetailResponse>('/photos/detail', params);
      
      console.log('=== PHOTO SERVICE getPhotoDetail RESPONSE ===');
      console.log('response.data:', JSON.stringify(response.data, null, 2));
      console.log('=============================================');
      
      if (!response.data?.success) {
        console.error('Photo detail request failed:', response.data);
        throw new Error('Failed to fetch photo detail');
      }
      
      const photoDetail = response.data.data;
      
      console.log('Extracted photoDetail:', JSON.stringify(photoDetail, null, 2));
      
      if (!photoDetail || !photoDetail.id) {
        console.error('Invalid photo detail structure:', photoDetail);
        throw new Error('Invalid photo detail response');
      }
      
      return photoDetail;
    } catch (error) {
      console.error('PhotoService.getPhotoDetail error:', error);
      throw error;
    }
  }

  /**
   * Upload a new photo
   */
  async uploadPhoto(params: UploadPhotoParams): Promise<Photo> {
    try {
      const formData = new FormData();
      
      formData.append('image', {
        uri: params.image.uri,
        type: params.image.type || 'image/jpeg',
        name: params.image.name || 'photo.jpg',
      } as any);
      
      formData.append('districtCode', params.districtCode);
      formData.append('longitude', params.longitude.toString());
      formData.append('latitude', params.latitude.toString());
      
      // Optional fields
      if (params.story) {
        formData.append('story', params.story);
      }
      
      if (params.address) {
        formData.append('address', params.address);
      }
      
      if (params.era) {
        formData.append('era', params.era);
      }
      
      const response = await api.post<UploadPhotoResponse>('/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data?.success) {
        throw new Error('Failed to upload photo');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('PhotoService.uploadPhoto error:', error);
      throw error;
    }
  }

  /**
   * Delete a photo
   */
  async deletePhoto(params: DeletePhotoParams): Promise<void> {
    try {
      const response = await api.post<DeletePhotoResponse>('/photos/delete', params);
      
      if (!response.data?.success) {
        throw new Error('Failed to delete photo');
      }
    } catch (error) {
      console.error('PhotoService.deletePhoto error:', error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
export default photoService;
