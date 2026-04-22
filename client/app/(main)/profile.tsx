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
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/userService';
import { Photo } from '@/types';
import { PhotoGrid } from '@/components/common/PhotoGrid';
import { getMyVideos, MyVideo } from '@/services/videoService';
import theme from 'src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PaginationState {
  page: number;
  totalPages: number;
}

export default function ProfileScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    totalPages: 1,
  });

  // Initialize activeTab from route param if provided
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>(
    tabParam === 'videos' ? 'videos' : 'photos'
  );

  // ── AI Videos state ──
  const [myVideos, setMyVideos] = useState<MyVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<MyVideo | null>(null);

  const LIMIT = 20;

  // ─── Photos fetch ─────────────────────────────────────────────────────────────

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

  // ─── AI Videos fetch ──────────────────────────────────────────────────────────
  const fetchMyVideos = useCallback(async () => {
    setVideosLoading(true);
    setVideosError(null);
    try {
      const data = await getMyVideos();
      setMyVideos(data || []);
    } catch (err: any) {
      console.error('Failed to fetch AI videos:', err);
      setVideosError('Failed to load videos');
    } finally {
      setVideosLoading(false);
    }
  }, []);

  // 初始化 + tab 切换时刷新对应数据
  useEffect(() => {
    if (activeTab === 'photos') {
      fetchPhotos(1, true);
    } else {
      fetchMyVideos();
    }
  }, [activeTab, fetchPhotos, fetchMyVideos]);

  // Fetch videos when tab becomes active
  useEffect(() => {
    if (activeTab === 'videos') {
      fetchMyVideos();
    }
  }, [activeTab, fetchMyVideos]);

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'photos') {
      await fetchPhotos(1, true);
    } else {
      await fetchMyVideos();
    }
    setRefreshing(false);
  }, [activeTab, fetchPhotos, fetchMyVideos]);

  // ─── Photos handlers ──────────────────────────────────────────────────────────

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || activeTab !== 'photos') return;
    setLoadingMore(true);
    await fetchPhotos(pagination.page + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore, pagination.page, fetchPhotos, activeTab]);

  const handlePhotoPress = useCallback((photoId: string) => {
    router.push(`/photo/${photoId}` as any);
  }, []);

  // ─── Auth handlers ────────────────────────────────────────────────────────────

  const handleLogoutPress = useCallback(() => {
    setShowMenu(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login' as any);
        },
      },
    ]);
  }, [logout]);

  const handleEditProfile = () => {
    setShowMenu(false);
    setNewUsername(user?.username || '');
    setNewAvatarUri(null);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    setIsUpdating(true);
    try {
      await updateProfile({ username: newUsername.trim() });
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const displayName = user?.username || 'Unknown User';
  const displayEmail = user?.email || '';
  const displayPhotosCount = user?.photosCount ?? photos.length;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // ─── Render: AI Video card ────────────────────────────────────────────────────

  const renderVideoCard = ({ item }: { item: MyVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      activeOpacity={0.8}
      onPress={() => setPlayingVideo(item)}
    >
      {/* Thumbnail */}
      <View style={styles.videoThumbnailWrapper}>
        {item.photoImageUrl ? (
          <Image
            source={{ uri: item.photoImageUrl }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.videoThumbnail, styles.videoThumbnailPlaceholder]}>
            <Ionicons name="image-outline" size={32} color={theme.colors.gray500} />
          </View>
        )}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={40} color="#fff" />
        </View>
      </View>

      {/* Meta */}
      <View style={styles.videoMeta}>
        {item.photoEra && (
          <Text style={styles.videoEra}>{item.photoEra}</Text>
        )}
        <Text style={styles.videoPrompt} numberOfLines={2}>
          {item.prompt}
        </Text>
        {item.generatedAt && (
          <Text style={styles.videoDate}>
            {new Date(item.generatedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // ─── Render: AI Videos tab content ───────────────────────────────────────────

  const renderVideosTab = () => {
    if (videosLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (videosError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{videosError}</Text>
          <TouchableOpacity onPress={fetchMyVideos}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (myVideos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color={theme.colors.gray500} />
          <Text style={styles.emptyText}>No AI videos yet</Text>
          <Text style={styles.emptySubText}>
            Walk near a historical photo and create your own recreation
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={myVideos}
        keyExtractor={(item) => item.videoId}
        renderItem={renderVideoCard}
        contentContainerStyle={styles.videoList}
        scrollEnabled={false}
      />
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* User section */}
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
            <Text style={styles.photosCount}>{displayPhotosCount} photos</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
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

      {/* Main scroll */}
      {activeTab === 'photos' ? (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhotoGrid 
              photos={[item]} 
              onPhotoPress={handlePhotoPress} 
              numColumns={2} 
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ padding: 20 }} color={theme.colors.primary} /> : null
          }
          ListEmptyComponent={
            fetchError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{fetchError}</Text>
                <TouchableOpacity onPress={() => fetchPhotos(1, true)}>
                  <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={[{ key: 'videos' }]}  
          renderItem={() => renderVideosTab()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          scrollEnabled={true}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={!!playingVideo}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setPlayingVideo(null)}
      >
        <View style={styles.playerOverlay}>
          <TouchableOpacity
            style={styles.playerClose}
            onPress={() => setPlayingVideo(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>

          {playingVideo?.url && (
            <Video
              source={{ uri: playingVideo.url }}
              style={styles.videoPlayer}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
              isLooping={false}
            />
          )}

          {/* Video info */}
          <View style={styles.playerInfo}>
            {playingVideo?.photoEra && (
              <Text style={styles.playerEra}>{playingVideo.photoEra}</Text>
            )}
            <Text style={styles.playerPrompt} numberOfLines={3}>
              {playingVideo?.prompt}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
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
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <Ionicons name="person-outline" size={20} color={theme.colors.text} />
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={() => {
                Alert.alert('Choose Avatar', 'Image picker will be integrated here', [
                  { text: 'Cancel' },
                  {
                    text: 'Use Demo URI',
                    onPress: () => setNewAvatarUri('https://example.com/new-avatar.jpg'),
                  },
                ]);
              }}
            >
              {newAvatarUri || user?.avatar ? (
                <Image style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>{avatarInitial}</Text>
                </View>
              )}
              <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor={theme.colors.gray500}
              autoCapitalize="none"
            />

            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  avatarLarge: {
    width: 96,
    height: 96,
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
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  avatarEditContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  changeAvatarText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.primary,
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 20,
    fontFamily: theme.fonts.title,
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  editModalContainer: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 24,
  },
  editModalTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    marginBottom: 24,
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.fontWeight.semibold,
  },
  // ── Video card ──
  videoList: {
    padding: 16,
    gap: 16,
  },
  videoCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnailWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    backgroundColor: theme.colors.gray500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  videoMeta: {
    padding: 12,
    gap: 4,
  },
  videoEra: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  videoPrompt: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  videoDate: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  // ── Video Player Modal ──
  playerOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  playerClose: {
    position: 'absolute',
    top: 52,
    right: 16,
    zIndex: 10,
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16),
  },
  playerInfo: {
    padding: 20,
    gap: 8,
  },
  playerEra: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  playerPrompt: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
  },
});