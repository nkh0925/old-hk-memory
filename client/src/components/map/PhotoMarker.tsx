/**
 * PhotoMarker Component
 * Custom map marker displaying photo thumbnail with optional AR indicator
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import theme from 'src/theme';   // 使用优化后的 Modern Archive theme

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
    borderRadius: 6,                    // 微方角，更像旧照片卡片
    borderWidth: 1.5,
    borderColor: theme.colors.border,   // 柔和旧纸边框
    backgroundColor: theme.colors.background,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.gray100,
  },
  arBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: 4,                    // 微方角印章感
    backgroundColor: theme.colors.error, // Stamp Red
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
  arBadgeText: {
    fontSize: 8,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',                   // 白字清晰对比
    letterSpacing: -0.5,
  },
});

// Export memoized component to prevent unnecessary re-renders
export default React.memo(PhotoMarker);