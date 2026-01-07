/**
 * Photo Store
 * Zustand store for managing photo state in Old Hong Kong Memory app
 */

import { create } from 'zustand';
import type {
  Photo,
  PhotoMarker,
  NearbyPhoto,
  PhotoDetail,
  Pagination,
  UploadPhotoParams,
} from '../types/photos';
import photoService from '../services/photoService';
import { ApiException } from '../services/api';

/**
 * Photo store state interface
 */
interface PhotoState {
  /** List of photos for gallery/list view */
  photos: Photo[];
  /** Map markers for map view */
  markers: PhotoMarker[];
  /** Nearby photos for location-based view */
  nearbyPhotos: NearbyPhoto[];
  /** Currently selected photo detail */
  currentPhoto: PhotoDetail | null;
  /** Pagination info for photo list */
  pagination: Pagination | null;
  /** Currently selected district filter */
  selectedDistrict: string | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message from last failed operation */
  error: string | null;
}

/**
 * Photo store actions interface
 */
interface PhotoActions {
  /** Fetch paginated photo list with optional filters */
  fetchPhotos: (district?: string, page?: number, limit?: number) => Promise<void>;
  /** Fetch map markers with optional district filter */
  fetchMarkers: (district?: string) => Promise<void>;
  /** Fetch photos near a location */
  fetchNearbyPhotos: (lng: number, lat: number, radius?: number) => Promise<void>;
  /** Fetch detailed info for a single photo */
  fetchPhotoDetail: (id: string) => Promise<void>;
  /** Upload a new photo */
  uploadPhoto: (params: UploadPhotoParams) => Promise<Photo>;
  /** Delete a photo by ID */
  deletePhoto: (id: string) => Promise<void>;
  /** Set the selected district filter */
  setSelectedDistrict: (code: string | null) => void;
  /** Clear the current photo detail */
  clearCurrentPhoto: () => void;
  /** Clear any existing error */
  clearError: () => void;
}

/**
 * Combined photo store type
 */
type PhotoStore = PhotoState & PhotoActions;

/**
 * Initial state values
 */
const initialState: PhotoState = {
  photos: [],
  markers: [],
  nearbyPhotos: [],
  currentPhoto: null,
  pagination: null,
  selectedDistrict: null,
  isLoading: false,
  error: null,
};

/**
 * Extract error message from various error types
 */
const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof ApiException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Photo store for managing all photo-related state
 */
export const usePhotoStore = create<PhotoStore>((set, get) => ({
  ...initialState,

  fetchPhotos: async (
    district?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const result = await photoService.getPhotos({
        district,
        page,
        limit,
      });

      set({
        photos: result.photos,
        pagination: result.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to fetch photos'),
      });
    }
  },

  fetchMarkers: async (district?: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const markers = await photoService.getMapMarkers({ district });

      set({
        markers,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to fetch map markers'),
      });
    }
  },

  fetchNearbyPhotos: async (
    lng: number,
    lat: number,
    radius?: number
  ): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const nearbyPhotos = await photoService.getNearbyPhotos({
        lng,
        lat,
        radius,
      });

      set({
        nearbyPhotos,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to fetch nearby photos'),
      });
    }
  },

  fetchPhotoDetail: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const photoDetail = await photoService.getPhotoDetail({ id });

      set({
        currentPhoto: photoDetail,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to fetch photo detail'),
      });
    }
  },

  uploadPhoto: async (params: UploadPhotoParams): Promise<Photo> => {
    set({ isLoading: true, error: null });

    try {
      const newPhoto = await photoService.uploadPhoto(params);

      // Prepend the new photo to the photos list
      set((state) => ({
        photos: [newPhoto, ...state.photos],
        isLoading: false,
        error: null,
      }));

      return newPhoto;
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to upload photo'),
      });
      throw error;
    }
  },

  deletePhoto: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      await photoService.deletePhoto({ id });

      // Remove the deleted photo from the photos list
      set((state) => ({
        photos: state.photos.filter((photo) => photo.id !== id),
        // Clear currentPhoto if it was the deleted one
        currentPhoto: state.currentPhoto?.id === id ? null : state.currentPhoto,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to delete photo'),
      });
      throw error;
    }
  },

  setSelectedDistrict: (code: string | null): void => {
    set({ selectedDistrict: code });
  },

  clearCurrentPhoto: (): void => {
    set({ currentPhoto: null });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ============================================================
// Selector Hooks for Optimized Re-renders
// ============================================================

/** Select photos array */
export const usePhotos = () => usePhotoStore((state) => state.photos);

/** Select map markers array */
export const useMarkers = () => usePhotoStore((state) => state.markers);

/** Select nearby photos array */
export const useNearbyPhotos = () => usePhotoStore((state) => state.nearbyPhotos);

/** Select current photo detail */
export const useCurrentPhoto = () => usePhotoStore((state) => state.currentPhoto);

/** Select pagination info */
export const usePagination = () => usePhotoStore((state) => state.pagination);

/** Select current district filter */
export const useSelectedDistrict = () => usePhotoStore((state) => state.selectedDistrict);

/** Select loading state */
export const usePhotoLoading = () => usePhotoStore((state) => state.isLoading);

/** Select error state */
export const usePhotoError = () => usePhotoStore((state) => state.error);

/** Check if there are more pages to load */
export const useHasMorePages = () =>
  usePhotoStore((state) => {
    if (!state.pagination) return false;
    return state.pagination.page < state.pagination.totalPages;
  });
