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
  // 新增：用于更新用户信息的 store action（假设你的 authStore 已支持 updateProfile）
  const updateProfile = useAuthStore((state) => state.updateProfile); // 如果没有，请告诉我，我帮你补充 store 代码

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // 新增：编辑个人信息 Modal 状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // 简单 URI 占位，后续可接图片选择器
  const [isUpdating, setIsUpdating] = useState(false);

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

  // 新增：打开编辑 Modal
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
      // 调用 store 更新（请确保 authStore 有 updateProfile 方法）
      await updateProfile({
        username: newUsername.trim(),
        // avatar: newAvatarUri || user?.avatar,
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

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

          {/* 右上角三点菜单按钮 */}
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

      {/* Content Area */}
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

      {/* 三点菜单 Modal */}
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

      {/* 新增：编辑个人信息 Modal - 档案式简洁弹窗 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Edit Profile</Text>

            {/* 头像部分 */}
            <TouchableOpacity 
              style={styles.avatarEditContainer}
              onPress={() => {
                // TODO: 后续接入 ImagePicker，这里用 Alert 模拟选择
                Alert.alert('Choose Avatar', 'Image picker will be integrated here', [
                  { text: 'Cancel' },
                  { text: 'Use Demo URI', onPress: () => setNewAvatarUri('https://example.com/new-avatar.jpg') }
                ]);
              }}
            >
              {newAvatarUri || user?.avatar ? (
                <Image 
                  // source={{ uri: newAvatarUri || user?.avatar }} 
                  style={styles.avatarLarge} 
                />
              ) : (
                <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>{avatarInitial}</Text>
                </View>
              )}
              <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
            </TouchableOpacity>

            {/* 用户名输入 */}
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

  /* Edit Profile Modal */
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
});