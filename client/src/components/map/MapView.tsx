/**
 * MapView Component
 * Wrapper around react-native-maps MapView for Old Hong Kong Memory app
 * Enhanced with default vintage archive map style
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
import theme from 'src/theme';   // 使用优化后的 Modern Archive theme

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
  /** Optional custom map style (overrides default vintage style) */
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
// Vintage Archive Map Style (复古档案风格)
// 低饱和、暖调纸张感、轻微褪色、突出老香港街道与地标
// ============================================================
const VINTAGE_ARCHIVE_MAP_STYLE: MapStyleElement[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#F5F2E9' }],           // 暖白纸张底色
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4A3F35' }],           // 碳墨文字色
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#E8E0D0' }],           // 老街道米黄色
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B5E4A' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#A8C4B8' }],           // 维多利亚港柔和青绿
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#EDE6D9' }],           // 轻微纸张纹理感
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],          // 简化非必要地标，突出历史感
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#D4C9B8' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: theme.colors.border, weight: 1.2 }],
  },
];


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
                  style={styles.markerImage}
                  resizeMode="cover"
                />
              </View>
            </Marker>
          );
        }),
      [markers, createMarkerPressHandler]
    );

    // 使用自定义样式或默认复古样式
    const finalMapStyle = customMapStyle || VINTAGE_ARCHIVE_MAP_STYLE;

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
        customMapStyle={finalMapStyle}
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
    borderRadius: 6,                    // 微方角，更像小型旧照片卡片
    borderWidth: 1.5,
    borderColor: theme.colors.border,   // 柔和旧纸边框
    backgroundColor: theme.colors.background,
  },
});

export default MapView;