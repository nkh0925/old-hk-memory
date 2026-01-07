import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import { Photo } from '@/types';
import { PhotoGrid } from '@/components/common/PhotoGrid';

interface PaginationState {
  page: number;
  totalPages: number;
}

export default function ProfileScreen() {
  // Get user from store - access the actual user object
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  console.log('=== PROFILE SCREEN DEBUG ===');
  console.log('Raw user from store:', JSON.stringify(user, null, 2));
  console.log('============================');

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
  });

  const LIMIT = 20;

  // Fetch photos
  const fetchPhotos = useCallback(async (page: number, isRefresh = false) => {
    try {
      setFetchError(null);
      console.log('Fetching photos, page:', page);
      
      const response = await userService.getMyPhotos({ page, limit: LIMIT });
      
      console.log('=== PROFILE fetchPhotos RESPONSE ===');
      console.log('data length:', response.data?.length);
      console.log('pagination:', response.pagination);
      console.log('====================================');

      const { data, pagination: paginationInfo } = response;

      if (isRefresh) {
        setPhotos(data || []);
      } else {
        setPhotos((prev) => [...prev, ...(data || [])]);
      }

      setPagination({
        page,
        totalPages: paginationInfo?.totalPages || 1,
      });
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      setFetchError('Failed to load photos');
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    }
  }, []);

  // Calculate if there's more data
  const hasMore = pagination.page < pagination.totalPages;

  // Initial fetch
  useEffect(() => {
    const loadInitialPhotos = async () => {
      console.log('Loading initial photos...');
      setLoading(true);
      await fetchPhotos(1, true);
      setLoading(false);
    };

    loadInitialPhotos();
  }, [fetchPhotos]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchPhotos(1, true);
    setLoading(false);
  }, [fetchPhotos]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    await fetchPhotos(pagination.page + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore, pagination.page, fetchPhotos]);

  // Navigate to photo detail
  const handlePhotoPress = useCallback((photoId: string) => {
    router.push(`/photo/${photoId}` as any);
  }, []);

  // Navigate to upload
  const handleUploadPress = useCallback(() => {
    router.push('/upload' as any);
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  }, [logout]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Get display values with fallbacks
  const displayName = user?.username || 'Unknown User';
  const displayEmail = user?.email || '';
  const displayPhotosCount = user?.photosCount ?? photos.length;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* User Info Header */}
      <View style={styles.userSection}>
        <View style={styles.userInfoRow}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>{avatarInitial}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
            <Text style={styles.photosCount}>
              {displayPhotosCount} {displayPhotosCount === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error State */}
      {fetchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Grid or Empty State */}
      {photos.length === 0 && !fetchError ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No photos yet</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadPress}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Upload your first photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PhotoGrid
          photos={photos}
          onPhotoPress={handlePhotoPress}
          onLoadMore={handleLoadMore}
          isLoading={loadingMore}
          numColumns={2}
        />
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  // User Section Styles
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  email: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  photosCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error State
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
  },
  retryText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Logout Button Styles
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 34,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
