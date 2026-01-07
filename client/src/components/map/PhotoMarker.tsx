/**
 * PhotoMarker Component
 * Custom map marker displaying photo thumbnail with optional AR indicator
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { Marker } from 'react-native-maps';

// ============================================================
// Types
// ============================================================

/**
 * Coordinate structure for marker position
 */
export interface MarkerCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Props for the PhotoMarker component
 */
export interface PhotoMarkerProps {
  /** Unique identifier for the marker */
  id: string;
  /** Geographic coordinate for marker position */
  coordinate: MarkerCoordinate;
  /** URL of the thumbnail image to display */
  thumbnailUrl: string;
  /** Whether this photo has an associated AR video */
  hasArVideo: boolean;
  /** Callback when marker is pressed */
  onPress: (id: string) => void;
}

// ============================================================
// Constants
// ============================================================

/** Size of the thumbnail image */
const THUMBNAIL_SIZE = 60;

/** Size of the AR badge */
const BADGE_SIZE = 20;

/** Border radius for circular thumbnail */
const THUMBNAIL_BORDER_RADIUS = THUMBNAIL_SIZE / 2;

/** Border radius for circular badge */
const BADGE_BORDER_RADIUS = BADGE_SIZE / 2;

// ============================================================
// Component
// ============================================================

/**
 * PhotoMarker component
 * Displays a photo thumbnail as a map marker with optional AR indicator
 */
const PhotoMarker: React.FC<PhotoMarkerProps> = ({
  id,
  coordinate,
  thumbnailUrl,
  hasArVideo,
  onPress,
}) => {
  /**
   * Handle marker press
   */
  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  return (
    <Marker
      identifier={id}
      coordinate={coordinate}
      onPress={handlePress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        {/* Thumbnail Image */}
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        {/* AR Badge */}
        {hasArVideo && (
          <View style={styles.arBadge}>
            <Text style={styles.arBadgeText}>AR</Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

// Set display name for debugging
PhotoMarker.displayName = 'PhotoMarker';

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    width: THUMBNAIL_SIZE + 4,
    height: THUMBNAIL_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailWrapper: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_BORDER_RADIUS,
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_BORDER_RADIUS,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E0E0E0',
  },
  arBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_BORDER_RADIUS,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 3,
  },
  arBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
});

// Export memoized component to prevent unnecessary re-renders
export default React.memo(PhotoMarker);
