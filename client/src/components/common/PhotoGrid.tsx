/**
 * PhotoGrid Component
 * Displays a grid of photos with view count overlay
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================================
// Types
// ============================================================

/**
 * Minimal photo interface for PhotoGrid
 * Compatible with both Photo types in the project
 */
export interface PhotoGridItem {
  /** Unique photo ID */
  id: string;
  /** Full resolution image URL */
  imageUrl: string;
  /** Optional thumbnail URL */
  thumbnailUrl?: string;
  /** View count */
  viewCount: number;
}

interface PhotoGridProps {
  /** Array of photos to display */
  photos: PhotoGridItem[];
  /** Callback when a photo is pressed */
  onPhotoPress: (id: string) => void;
  /** Callback when reaching end of list */
  onLoadMore?: () => void;
  /** Whether more content is loading */
  isLoading?: boolean;
  /** Number of columns in the grid */
  numColumns?: number;
}

interface PhotoGridItemComponentProps {
  /** Photo data */
  photo: PhotoGridItem;
  /** Callback when photo is pressed */
  onPress: (id: string) => void;
  /** Size of each grid item */
  itemSize: number;
}

// ============================================================
// Constants
// ============================================================

const GRID_GAP = 2;
const DEFAULT_NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================
// PhotoGridItemComponent (Memoized)
// ============================================================

const PhotoGridItemComponent = memo<PhotoGridItemComponentProps>(
  ({ photo, onPress, itemSize }) => {
    const handlePress = useCallback(() => {
      onPress(photo.id);
    }, [onPress, photo.id]);

    const imageSource = useMemo(
      () => ({ uri: photo.thumbnailUrl || photo.imageUrl }),
      [photo.thumbnailUrl, photo.imageUrl]
    );

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { width: itemSize, height: itemSize }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.viewCountOverlay}>
          <Ionicons name="eye" size={12} color="#FFFFFF" />
          <Text style={styles.viewCountText}>{photo.viewCount}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.photo.id === nextProps.photo.id &&
      prevProps.photo.viewCount === nextProps.photo.viewCount &&
      prevProps.photo.thumbnailUrl === nextProps.photo.thumbnailUrl &&
      prevProps.photo.imageUrl === nextProps.photo.imageUrl &&
      prevProps.itemSize === nextProps.itemSize
    );
  }
);

PhotoGridItemComponent.displayName = 'PhotoGridItemComponent';

// ============================================================
// Loading Footer Component
// ============================================================

const LoadingFooter = memo<{ isLoading: boolean }>(({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color="#666666" />
    </View>
  );
});

LoadingFooter.displayName = 'LoadingFooter';

// ============================================================
// Empty State Component
// ============================================================

const EmptyState = memo(() => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No photos</Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ============================================================
// PhotoGrid Component
// ============================================================

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoPress,
  onLoadMore,
  isLoading = false,
  numColumns = DEFAULT_NUM_COLUMNS,
}) => {
  // Calculate item size based on screen width and number of columns
  const itemSize = useMemo(() => {
    const totalGap = GRID_GAP * (numColumns - 1);
    return (SCREEN_WIDTH - totalGap) / numColumns;
  }, [numColumns]);

  // Render each grid item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhotoGridItem>) => (
      <PhotoGridItemComponent
        photo={item}
        onPress={onPhotoPress}
        itemSize={itemSize}
      />
    ),
    [onPhotoPress, itemSize]
  );

  // Render loading footer
  const renderFooter = useCallback(
    () => <LoadingFooter isLoading={isLoading} />,
    [isLoading]
  );

  // Render empty state
  const renderEmpty = useCallback(() => <EmptyState />, []);

  // Key extractor
  const keyExtractor = useCallback((item: PhotoGridItem) => item.id, []);

  // Handle end reached
  const handleEndReached = useCallback(() => {
    if (onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  // Item separator
  const ItemSeparator = useCallback(
    () => <View style={{ height: GRID_GAP }} />,
    []
  );

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`grid-${numColumns}`}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      contentContainerStyle={photos.length === 0 ? styles.emptyContent : undefined}
      ItemSeparatorComponent={ItemSeparator}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  columnWrapper: {
    gap: GRID_GAP,
  },
  itemContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  viewCountOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  viewCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default PhotoGrid;
