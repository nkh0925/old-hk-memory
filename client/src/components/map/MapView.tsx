/**
 * MapView Component
 * Wrapper around react-native-maps MapView for Old Hong Kong Memory app
 */

import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import RNMapView, {
  Marker,
  MapPressEvent,
  MapStyleElement,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import type { PhotoMarker } from '../../types/photos';

// ============================================================
// Types
// ============================================================

/**
 * Map coordinate structure used by react-native-maps
 */
export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Map region with delta values for zoom level
 */
export interface MapRegion extends MapCoordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Props for the MapView component
 */
export interface MapViewProps {
  /** Array of photo markers to display on the map */
  markers: PhotoMarker[];
  /** Callback when a marker is pressed */
  onMarkerPress: (id: string) => void;
  /** Optional callback when the map is pressed */
  onMapPress?: (coordinate: MapCoordinate) => void;
  /** Optional initial region to display */
  initialRegion?: MapRegion;
  /** Optional selected district filter (for future use) */
  selectedDistrict?: string;
  /** Optional flag to show user location */
  showsUserLocation?: boolean;
  /** Optional custom map style */
  customMapStyle?: MapStyleElement[];
}

/**
 * Ref type for accessing the underlying MapView
 */
export type MapViewRef = RNMapView;

// ============================================================
// Constants
// ============================================================

/**
 * Default region centered on Hong Kong
 */
const HONG_KONG_DEFAULT_REGION: MapRegion = {
  latitude: 22.3193,
  longitude: 114.1694,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

/**
 * Default marker size
 */
const MARKER_SIZE = 44;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert [lng, lat] coordinates to MapCoordinate format
 * @param coordinates - Coordinates in [longitude, latitude] format
 * @returns MapCoordinate object with latitude and longitude
 */
const toMapCoordinate = (coordinates: [number, number]): MapCoordinate => ({
  longitude: coordinates[0],
  latitude: coordinates[1],
});

// ============================================================
// Component
// ============================================================

/**
 * MapView wrapper component
 * Provides a consistent map interface with photo markers for the app
 */
const MapView = forwardRef<MapViewRef, MapViewProps>(
  (
    {
      markers,
      onMarkerPress,
      onMapPress,
      initialRegion = HONG_KONG_DEFAULT_REGION,
      selectedDistrict,
      showsUserLocation = false,
      customMapStyle,
    },
    ref
  ) => {
    /**
     * Handle map press events
     */
    const handleMapPress = useCallback(
      (event: MapPressEvent) => {
        if (onMapPress) {
          const { coordinate } = event.nativeEvent;
          onMapPress({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
        }
      },
      [onMapPress]
    );

    /**
     * Create marker press handler for a specific marker ID
     */
    const createMarkerPressHandler = useCallback(
      (id: string) => () => {
        onMarkerPress(id);
      },
      [onMarkerPress]
    );

    /**
     * Memoized markers to prevent unnecessary re-renders
     */
    const renderedMarkers = useMemo(
      () =>
        markers.map((marker) => {
          const coordinate = toMapCoordinate(marker.coordinates);

          return (
            <Marker
              key={marker.id}
              identifier={marker.id}
              coordinate={coordinate}
              onPress={createMarkerPressHandler(marker.id)}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <Image
                  source={{ uri: marker.thumbnailUrl }}
                  style={[
                    styles.markerImage,
                    marker.hasArVideo && styles.markerImageWithAr,
                  ]}
                  resizeMode="cover"
                />
                {marker.hasArVideo && <View style={styles.arIndicator} />}
              </View>
            </Marker>
          );
        }),
      [markers, createMarkerPressHandler]
    );

    return (
      <RNMapView
        ref={ref}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsUserLocation}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        pitchEnabled={false}
        onPress={handleMapPress}
        customMapStyle={customMapStyle}
        mapPadding={styles.mapPadding}
      >
        {renderedMarkers}
      </RNMapView>
    );
  }
);

// Set display name for debugging
MapView.displayName = 'MapView';

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapPadding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  markerContainer: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E0E0E0',
  },
  markerImageWithAr: {
    borderColor: '#FF6B35',
    borderWidth: 3,
  },
  arIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default MapView;
