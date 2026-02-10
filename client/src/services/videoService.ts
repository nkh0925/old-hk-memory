/**
 * Video Generation API Service
 * Handles AI-powered video generation from historical photos
 */

import api, { ApiException } from './api';
import type { ApiResponse } from '../types';

/* =======================
   Type Definitions
======================= */

/**
 * Video generation job status
 */
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Response from video generation initiation
 */
export interface VideoGenerationResponse {
  photoId: string;
  jobId: string;
  status: VideoStatus;
}

/**
 * Response from video status check
 */
export interface VideoStatusResponse {
  photoId: string;
  status: VideoStatus;
  videoUrl?: string;
  error?: string;
}

/**
 * Response containing video URL
 */
export interface VideoUrlResponse {
  videoUrl: string;
}

/* =======================
   Service Functions
======================= */

/**
 * Initiate video generation for a photo
 * 
 * @param photoId - The ID of the photo to generate video from
 * @returns Promise with generation job details
 * @throws {ApiException} When request fails
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await generateVideo('photo123');
 *   console.log('Job ID:', result.jobId);
 * } catch (error) {
 *   if (error instanceof ApiException) {
 *     console.error(error.message);
 *   }
 * }
 * ```
 */
export const generateVideo = async (
  photoId: string
): Promise<VideoGenerationResponse> => {
  try {
    const response = await api.post<ApiResponse<VideoGenerationResponse>>(
      '/videos/generate',
      { photoId }
    );

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'Failed to initiate video generation',
      'VIDEO_GENERATION_FAILED',
      500
    );
  }
};

/**
 * Check the status of a video generation job
 * 
 * @param photoId - The ID of the photo being processed
 * @returns Promise with current job status and video URL if completed
 * @throws {ApiException} When request fails
 * 
 * @example
 * ```typescript
 * try {
 *   const status = await checkVideoStatus('photo123');
 *   if (status.status === 'completed' && status.videoUrl) {
 *     console.log('Video ready:', status.videoUrl);
 *   }
 * } catch (error) {
 *   console.error('Status check failed:', error);
 * }
 * ```
 */
export const checkVideoStatus = async (
  photoId: string
): Promise<VideoStatusResponse> => {
  try {
    const response = await api.post<ApiResponse<VideoStatusResponse>>(
      '/videos/status',
      { photoId }
    );

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'Failed to check video status',
      'VIDEO_STATUS_CHECK_FAILED',
      500
    );
  }
};

/**
 * Get the video URL for a completed video
 * 
 * @param photoId - The ID of the photo with completed video
 * @returns Promise with video URL
 * @throws {ApiException} When request fails or video not found
 * 
 * @example
 * ```typescript
 * try {
 *   const { videoUrl } = await getVideoUrl('photo123');
 *   // Play video from videoUrl
 * } catch (error) {
 *   if (error instanceof ApiException && error.status === 404) {
 *     console.log('Video not found or not ready');
 *   }
 * }
 * ```
 */
export const getVideoUrl = async (
  photoId: string
): Promise<VideoUrlResponse> => {
  try {
    const response = await api.get<ApiResponse<VideoUrlResponse>>(
      `/videos/${photoId}`
    );

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      'Failed to retrieve video URL',
      'VIDEO_URL_FETCH_FAILED',
      500
    );
  }
};

/**
 * Poll video status until completion or failure
 * Useful for showing progress to users
 * 
 * @param photoId - The ID of the photo being processed
 * @param onProgress - Callback function called on each status update
 * @param interval - Polling interval in milliseconds (default: 3000)
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @returns Promise with final video status
 * @throws {ApiException} When polling fails or times out
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await pollVideoStatus(
 *     'photo123',
 *     (status) => console.log('Current status:', status.status),
 *     3000,
 *     60
 *   );
 *   if (result.status === 'completed') {
 *     console.log('Video URL:', result.videoUrl);
 *   }
 * } catch (error) {
 *   console.error('Polling failed:', error);
 * }
 * ```
 */
export const pollVideoStatus = async (
  photoId: string,
  onProgress?: (status: VideoStatusResponse) => void,
  interval: number = 3000,
  maxAttempts: number = 60
): Promise<VideoStatusResponse> => {
  let attempts = 0;

  const poll = async (): Promise<VideoStatusResponse> => {
    attempts++;

    if (attempts > maxAttempts) {
      throw new ApiException(
        'Video generation timeout',
        'VIDEO_GENERATION_TIMEOUT',
        408
      );
    }

    const status = await checkVideoStatus(photoId);

    // Call progress callback if provided
    if (onProgress) {
      onProgress(status);
    }

    // Return if completed or failed
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // Wait and poll again
    await new Promise((resolve) => setTimeout(resolve, interval));
    return poll();
  };

  return poll();
};
