/**
 * District Store
 * Zustand store for managing district state with caching
 */

import { create } from 'zustand';
import type { District } from '../types/district';
import districtService from '../services/districtService';
import { ApiException } from '../services/api';

/**
 * District store state interface
 */
interface DistrictState {
  /** List of all districts */
  districts: District[];
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message from last failed operation */
  error: string | null;
  /** Whether districts have been fetched at least once */
  _hasFetched: boolean;
}

/**
 * District store actions interface
 */
interface DistrictActions {
  /** Fetch districts from API (uses cache if available) */
  fetchDistricts: (forceRefresh?: boolean) => Promise<void>;
  /** Get a single district by its code */
  getDistrictByCode: (code: string) => District | undefined;
  /** Clear any existing error */
  clearError: () => void;
}

/**
 * Combined district store type
 */
type DistrictStore = DistrictState & DistrictActions;

/**
 * Initial state values
 */
const initialState: DistrictState = {
  districts: [],
  isLoading: false,
  error: null,
  _hasFetched: false,
};

/**
 * District store with caching support
 * Districts are cached after first successful fetch
 */
export const useDistrictStore = create<DistrictStore>((set, get) => ({
  ...initialState,

  fetchDistricts: async (forceRefresh = false): Promise<void> => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state._hasFetched && state.districts.length > 0 && !forceRefresh) {
      return;
    }

    // Prevent duplicate requests while loading
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const districts = await districtService.getDistricts();

      set({
        districts,
        isLoading: false,
        error: null,
        _hasFetched: true,
      });
    } catch (error) {
      let errorMessage = 'Failed to fetch districts';

      if (error instanceof ApiException) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  getDistrictByCode: (code: string): District | undefined => {
    const { districts } = get();
    return districts.find((district) => district.code === code);
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

/**
 * Selector hooks for optimized re-renders
 */
export const useDistricts = () => useDistrictStore((state) => state.districts);
export const useDistrictsLoading = () => useDistrictStore((state) => state.isLoading);
export const useDistrictsError = () => useDistrictStore((state) => state.error);
