/**
 * Map Page
 * Main map view displaying photo markers with district filtering
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Components
import { MapView, DistrictFilter } from '../../src/components/map';

// Stores
import { useDistrictStore } from '../../src/stores/districtStore';
import { usePhotoStore } from '../../src/stores/photoStore';

// ============================================================
// Component
// ============================================================

/**
 * MapPage component
 * Main map view with photo markers and district filtering
 */
export default function MapPage(): React.JSX.Element {
  // Hooks
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // District store
  const districts = useDistrictStore((state) => state.districts);
  const isDistrictsLoading = useDistrictStore((state) => state.isLoading);
  const fetchDistricts = useDistrictStore((state) => state.fetchDistricts);

  // Photo store
  const markers = usePhotoStore((state) => state.markers);
  const selectedDistrict = usePhotoStore((state) => state.selectedDistrict);
  const isMarkersLoading = usePhotoStore((state) => state.isLoading);
  const fetchMarkers = usePhotoStore((state) => state.fetchMarkers);
  const setSelectedDistrict = usePhotoStore((state) => state.setSelectedDistrict);

  // Combined loading state
  const isLoading = isDistrictsLoading || isMarkersLoading;

  /**
   * Fetch initial data on mount
   */
  useEffect(() => {
    fetchDistricts();
    fetchMarkers();
  }, [fetchDistricts, fetchMarkers]);

  /**
   * Handle district selection
   */
  const handleDistrictSelect = useCallback(
    (code: string | null) => {
      setSelectedDistrict(code);
      fetchMarkers(code ?? undefined);
    },
    [setSelectedDistrict, fetchMarkers]
  );

  /**
   * Handle marker press - navigate to photo detail
   */
  const handleMarkerPress = useCallback(
    (id: string) => {
      router.push(`/photo/${id}` as any);
    },
    [router]
  );

  /**
   * Handle map press (optional - for future use)
   */
  const handleMapPress = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      // Can be used for adding new photos at location
      console.log('Map pressed at:', coordinate);
    },
    []
  );

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        markers={markers}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
        selectedDistrict={selectedDistrict ?? undefined}
      />

      {/* District Filter - Absolute positioned at top */}
      <View
        style={[
          styles.filterContainer,
          { paddingTop: insets.top > 0 ? insets.top : 10 },
        ]}
      >
        <DistrictFilter
          districts={districts}
          selectedCode={selectedDistrict}
          onSelect={handleDistrictSelect}
          isLoading={isDistrictsLoading}
        />
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
