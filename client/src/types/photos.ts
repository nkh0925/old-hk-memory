/**
 * Photo type definitions
 * Types for Old Hong Kong Memory photo data structures
 */

/**
 * Geographic coordinates [longitude, latitude]
 */
export type Coordinates = [number, number];

/**
 * Photo era/time period identifier
 */
export type Era = '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | 'unknown';

/**
 * AI Video generation status (replaces previous AR video)
 */
export type VideoStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Location information for a photo
 */
export interface PhotoLocation {
  /** Geographic coordinates [longitude, latitude] */
  coordinates: Coordinates;
  /** Optional street address */
  address?: string;
}

/**
 * District reference in photo
 */
export interface PhotoDistrict {
  /** District code (e.g., "central") */
  code: string;
  /** Display name of the district */
  name: string;
}

/**
 * User reference for photo uploader
 */
export interface PhotoUploader {
  /** User ID */
  id: string;
  /** Display username */
  username: string;
  /** Optional avatar URL */
  avatar?: string;
}

/**
 * AI-generated video information
 */
export interface AiVideo {
  /** Video generation status */
  status: VideoStatus;
  /** Video URL (available when status is 'completed') */
  url?: string;
  /** Optional error message when generation failed */
  error?: string;
}

/**
 * Base photo entity
 */
export interface Photo {
  /** Unique photo ID */
  id: string;
  /** Full resolution image URL */
  imageUrl: string;
  /** Optional thumbnail URL */
  thumbnailUrl?: string;
  /** Optional story/description */
  story?: string;
  /** Location information */
  location: PhotoLocation;
  /** District information */
  district: PhotoDistrict;
  /** Uploader information */
  uploader: PhotoUploader;
  /** Optional era/time period */
  era?: Era;
  /** AI video information */
  aiVideo: AiVideo;
  /** View count */
  viewCount: number;
  /** Creation timestamp (ISO string) */
  createdAt: string;
}

/**
 * Photo marker for map display
 */
export interface PhotoMarker {
  /** Unique photo ID */
  id: string;
  /** Geographic coordinates [longitude, latitude] */
  coordinates: Coordinates;
  /** Thumbnail URL for marker popup */
  thumbnailUrl: string;
}

/**
 * Nearby photo with distance information
 */
export interface NearbyPhoto {
  /** Unique photo ID */
  id: string;
  /** Full resolution image URL */
  imageUrl: string;
  /** Optional story/description */
  story?: string;
  /** Distance from query point in meters */
  distance: number;
  /** AI video information */
  aiVideo?: AiVideo;
  /** Uploader information (minimal) */
  uploader: Pick<PhotoUploader, 'username'>;
}

/**
 * Full photo detail 
 */
export interface PhotoDetail extends Photo {
  // No additional fields needed (aiVideo is already in base Photo)
}

// ============================================================
// Request Parameters
// ============================================================

/**
 * Parameters for fetching photo list
 */
export interface PhotoListParams {
  /** Filter by district code */
  district?: string;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Parameters for fetching map markers
 */
export interface PhotoMapParams {
  /** Filter by district code */
  district?: string;
}

/**
 * Parameters for fetching nearby photos
 */
export interface NearbyPhotoParams {
  /** Longitude */
  lng: number;
  /** Latitude */
  lat: number;
  /** Search radius in meters */
  radius?: number;
}

/**
 * Parameters for fetching photo detail
 */
export interface PhotoDetailParams {
  /** Photo ID */
  id: string;
}

/**
 * Parameters for uploading a photo
 */
export interface UploadPhotoParams {
  /** Image file (from image picker) */
  image: {
    uri: string;
    type?: string;
    name?: string;
  };
  /** Longitude of photo location */
  longitude: number;
  /** Latitude of photo location */
  latitude: number;
  /** Optional street address */
  address?: string;
  /** District code */
  districtCode: string;
  /** Optional story/description */
  story?: string;
  /** Optional era/time period */
  era?: Era;
}

/**
 * Parameters for deleting a photo
 */
export interface DeletePhotoParams {
  /** Photo ID */
  id: string;
}

// ============================================================
// API Responses
// ============================================================

/**
 * Pagination information
 */
export interface Pagination {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Response for photo list endpoint
 */
export interface PhotoListResponse {
  success: boolean;
  data: Photo[];
  pagination: Pagination;
}

/**
 * Response for photo map endpoint
 */
export interface PhotoMapResponse {
  success: boolean;
  data: PhotoMarker[];
}

/**
 * Response for nearby photos endpoint
 */
export interface NearbyPhotoResponse {
  success: boolean;
  data: NearbyPhoto[];
}

/**
 * Response for photo detail endpoint
 */
export interface PhotoDetailResponse {
  success: boolean;
  data: PhotoDetail;
}

/**
 * Response for photo upload endpoint
 */
export interface UploadPhotoResponse {
  success: boolean;
  data: Photo;
}

/**
 * Response for photo delete endpoint
 */
export interface DeletePhotoResponse {
  success: boolean;
  message: string;
}