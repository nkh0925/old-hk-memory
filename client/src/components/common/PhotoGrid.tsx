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
import theme from 'src/theme';

export interface PhotoGridItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  // viewCount 已移除
}

interface PhotoGridProps {
  photos: PhotoGridItem[];
  onPhotoPress: (id: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  numColumns?: number;
}

const GRID_GAP = 2;
const DEFAULT_NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

const PhotoGridItemComponent = memo<{ photo: PhotoGridItem; onPress: (id: string) => void; itemSize: number }>(
  ({ photo, onPress, itemSize }) => {
    const handlePress = useCallback(() => onPress(photo.id), [onPress, photo.id]);

    const imageSource = useMemo(() => ({ uri: photo.thumbnailUrl || photo.imageUrl }), [photo.thumbnailUrl, photo.imageUrl]);

    return (
      <TouchableOpacity
        style={[styles.itemContainer, { width: itemSize, height: itemSize }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }
);

PhotoGridItemComponent.displayName = 'PhotoGridItemComponent';

const LoadingFooter = memo<{ isLoading: boolean }>(({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
    </View>
  );
});

const EmptyState = memo(() => (
  <View style={styles.emptyContainer}>
    <Ionicons name="images-outline" size={48} color={theme.colors.gray500} />
    <Text style={styles.emptyText}>No photos</Text>
  </View>
));

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoPress,
  onLoadMore,
  isLoading = false,
  numColumns = DEFAULT_NUM_COLUMNS,
}) => {
  const itemSize = useMemo(() => {
    const totalGap = GRID_GAP * (numColumns - 1);
    return (SCREEN_WIDTH - totalGap) / numColumns;
  }, [numColumns]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhotoGridItem>) => (
      <PhotoGridItemComponent photo={item} onPress={onPhotoPress} itemSize={itemSize} />
    ),
    [onPhotoPress, itemSize]
  );

  const renderFooter = useCallback(() => <LoadingFooter isLoading={isLoading} />, [isLoading]);
  const renderEmpty = useCallback(() => <EmptyState />, []);
  const keyExtractor = useCallback((item: PhotoGridItem) => item.id, []);
  const handleEndReached = useCallback(() => {
    if (onLoadMore && !isLoading) onLoadMore();
  }, [onLoadMore, isLoading]);

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`grid-${numColumns}`}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      contentContainerStyle={photos.length === 0 ? styles.emptyContent : undefined}
      ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
};

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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingFooter: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray500,
    marginTop: 12,
  },
});

export default PhotoGrid;