// Global shared TypeScript types for the app
export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  photosCount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ArVideo {
  url: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
}

export interface Location {
  coordinates: [number, number]; // [lng, lat]
  address: string;
}

export interface Photo {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  story: string;
  location: Location;
  district: string;
  uploader: User;
  era: string;
  arVideo: ArVideo | null;
  viewCount: number;
  createdAt: string;
}

export interface PhotoMarker {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  thumbnailUrl: string;
  hasArVideo: boolean;
}

export interface District {
  code: string;
  name: string;
  region: string;
  center: [number, number]; // [lng, lat]
  photosCount: number;
}

/* =======================
   API Response Types
======================= */

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}
