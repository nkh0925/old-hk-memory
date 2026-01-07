/**
 * District type definitions
 */

/**
 * Geographic center coordinates
 */
export interface DistrictCenter {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * District region type
 */
export type DistrictRegion = 'hk_island' | 'kowloon' | 'new_territories';

/**
 * District entity
 */
export interface District {
  /** MongoDB ID */
  _id: string;
  /** District code (e.g., "central") */
  code: string;
  /** Display name */
  name: string;
  /** Region */
  region: DistrictRegion;
  /** Geographic center */
  center: DistrictCenter;
  /** Number of photos in this district */
  photosCount: number;
}

/**
 * API response for district list
 */
export interface DistrictListResponse {
  success: boolean;
  message?: string;
  data: {
    count: number;
    districts: District[];
  };
}
