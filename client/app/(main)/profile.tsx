import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import { Photo } from '@/types';
import { PhotoGrid } from '@/components/common/PhotoGrid';
import theme from 'src/theme';

interface PaginationState {
  page: number;
  totalPages: number;
}

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
  });

  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  const LIMIT = 20;

  const fetchPhotos = useCallback(async (page: number, isRefresh = false) => {
    try {
      setFetchError(null);
      const response = await userService.getMyPhotos({ page, limit: LIMIT });
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

  const hasMore = pagination.page < pagination.totalPages;

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      await fetchPhotos(1, true);
      setLoading(false);
    };
    loadInitial();
  }, [fetchPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhotos(1, true);
    setRefreshing(false);
  }, [fetchPhotos]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || activeTab !== 'photos') return;
    setLoadingMore(true);
    await fetchPhotos(pagination.page + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore, pagination.page, fetchPhotos, activeTab]);

  const handlePhotoPress = useCallback((photoId: string) => {
    router.push(`/photo/${photoId}` as any);
  }, []);

  const handleLogoutPress = useCallback(() => {
    setShowMenu(false);
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

  const displayName = user?.username || 'Unknown User';
  const displayEmail = user?.email || '';
  const displayPhotosCount = user?.photosCount ?? photos.length;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* User Info Header - 精简档案卡片 */}
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
              {displayPhotosCount} photos
            </Text>
          </View>

          {/* 右上角三点菜单按钮（仅 Logout） */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* TikTok-style Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'photos' && styles.tabItemActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
            My Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'videos' && styles.tabItemActive]}
          onPress={() => setActiveTab('videos')}
        >
          <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
            My AI Videos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - 九宫格形式通过 PhotoGrid 实现 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        onScrollEndDrag={handleLoadMore}
        scrollEventThrottle={16}
      >
        {activeTab === 'photos' ? (
          <>
            {fetchError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{fetchError}</Text>
                <TouchableOpacity onPress={onRefresh}>
                  <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            )}

            <PhotoGrid
              photos={photos}
              onPhotoPress={handlePhotoPress}
              onLoadMore={handleLoadMore}
              isLoading={loadingMore}
              numColumns={2}
            />

            {loadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={theme.colors.gray500} />
            <Text style={styles.emptyText}>No AI videos yet</Text>
            <Text style={styles.emptySubText}>AI-generated videos will appear here</Text>
          </View>
        )}
      </ScrollView>

      {/* 右上角菜单 Modal（仅 Logout） */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 20,
    fontFamily: theme.fonts.title,   // Serif 怀旧标题
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  email: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  photosCount: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray500,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },

  content: { flex: 1 },
  contentContainer: { paddingBottom: 40 },

  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  retryText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.gray500,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.gray500,
    textAlign: 'center',
  },

  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  /* Menu Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingVertical: 8,
    width: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});