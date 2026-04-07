import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { usePhotoStore } from '@/stores/photoStore';
import api from '../../src/services/api';
import theme from 'src/theme';   // 确保使用优化后的 theme

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function PhotoDetailScreen(): JSX.Element {
  const { id, autoPlay } = useLocalSearchParams<{ id: string, autoPlay?: string }>();
  const router = useRouter();
  
  // UI States
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Video States
  const [officialVideoUrl, setOfficialVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const shouldAutoStart = autoPlay === 'true';
  const currentPhoto = usePhotoStore((state) => state.currentPhoto);
  const isLoading = usePhotoStore((state) => state.isLoading);
  const error = usePhotoStore((state) => state.error);
  const fetchPhotoDetail = usePhotoStore((state) => state.fetchPhotoDetail);
  const clearCurrentPhoto = usePhotoStore((state) => state.clearCurrentPhoto);

  useEffect(() => {
    if (id) fetchPhotoDetail(id);
    return () => clearCurrentPhoto();
  }, [id]);

  // Fetch official video if completed
  useEffect(() => {
    const fetchVideoUrl = async () => {
      const photo = currentPhoto as any; 
      if (photo && photo.officialVideoStatus === 'completed') {
        try {
          setVideoLoading(true);
          const response = await api.get(`/videos/${photo.id}`);
          setOfficialVideoUrl(response.data?.data?.url || response.data?.url);
        } catch (err) {
          console.error('Failed to fetch official video URL', err);
        } finally {
          setVideoLoading(false);
        }
      }
    };
    fetchVideoUrl();
  }, [currentPhoto]);

  const handleBackPress = () => router.back();
  const handleImageError = () => { setImageError(true); setImageLoading(false); };
  const handleImageLoad = () => setImageLoading(false);

  if (isLoading && !currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ 
          headerShown: true, 
          headerTitle: '', 
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) 
        }} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  if (error && !currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ 
          headerShown: true, 
          headerTitle: '', 
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) 
        }} />
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => id && fetchPhotoDetail(id)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentPhoto) return <View style={styles.container} />;
  
  const district = currentPhoto.district || { name: 'Unknown', code: '' };
  const location = currentPhoto.location || { coordinates: [0, 0], address: '' };
  const uploader = currentPhoto.uploader || { username: 'Unknown', avatar: null };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButtonOverlay}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          {imageError ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={theme.colors.border} />
              <Text style={styles.imageErrorText}>Failed to load image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: currentPhoto.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>

        <View style={styles.content}>
          
          {/* Official Video Player Section */}
          {(currentPhoto as any).officialVideoStatus === 'completed' && (
            <View style={styles.videoSection}>
              <View style={styles.videoHeader}>
                <Ionicons name="film" size={20} color={theme.colors.primary} />
                <Text style={styles.videoTitle}>Official Memory Restored</Text>
              </View>
              {videoLoading ? (
                <View style={[styles.videoPlayer, styles.videoLoadingBox]}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : officialVideoUrl ? (
                <Video
                  source={{ uri: officialVideoUrl }}
                  style={styles.videoPlayer}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isMuted
                  isLooping
                  useNativeControls
                />
              ) : null}
            </View>
          )}

          {/* Regular Photo Information */}
          {currentPhoto.era && (
            <View style={styles.eraBadge}>
              <Text style={styles.eraBadgeText}>{currentPhoto.era}</Text>
            </View>
          )}

          {currentPhoto.story && (
            <Text style={styles.storyText}>{currentPhoto.story}</Text>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={theme.colors.secondary} />
            <Text style={styles.infoText}>
              {district.name || 'Unknown location'}
              {location.address ? ` · ${location.address}` : ''}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={20} color={theme.colors.secondary} />
            <Text style={styles.infoText}>{(currentPhoto.viewCount || 0).toLocaleString()} views</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.secondary} />
            <Text style={styles.infoText}>{currentPhoto.createdAt ? formatDate(currentPhoto.createdAt) : 'Unknown date'}</Text>
          </View>

          <View style={styles.uploaderRow}>
            {uploader.avatar ? (
              <Image source={{ uri: uploader.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={theme.colors.secondary} />
              </View>
            )}
            <Text style={styles.uploaderName}>{uploader.username || 'Unknown'}</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollView: { flex: 1 },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.background, 
    padding: theme.spacing.lg 
  },
  backButton: { padding: 8 },
  backButtonOverlay: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: theme.fontSize.md, 
    color: theme.colors.secondary 
  },
  errorText: { 
    marginTop: 12, 
    fontSize: theme.fontSize.md, 
    color: theme.colors.secondary, 
    textAlign: 'center' 
  },
  retryButton: { 
    marginTop: 16, 
    paddingHorizontal: 24, 
    paddingVertical: 10, 
    backgroundColor: theme.colors.primary, 
    borderRadius: theme.borderRadius.sm 
  },
  retryButtonText: { 
    color: '#FFF', 
    fontSize: theme.fontSize.md, 
    fontWeight: theme.fontWeight.semibold 
  },
  imageContainer: { 
    width: SCREEN_WIDTH, 
    height: 320, 
    backgroundColor: theme.colors.background, 
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  image: { width: '100%', height: '100%' },
  imageLoadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.background, 
    zIndex: 1 
  },
  imagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.gray100, 
    padding: theme.spacing.md 
  },
  imageErrorText: { 
    marginTop: 8, 
    fontSize: theme.fontSize.sm, 
    color: theme.colors.secondary 
  },
  content: { 
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    margin: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  
  // Video Section
  videoSection: { 
    marginBottom: 24, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  videoHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    gap: 8 
  },
  videoTitle: { 
    fontSize: theme.fontSize.xl, 
    fontFamily: theme.fonts.title, 
    fontWeight: theme.fontWeight.bold, 
    color: theme.colors.text 
  },
  videoPlayer: { 
    width: '100%', 
    height: 220, 
    borderRadius: theme.borderRadius.sm, 
    backgroundColor: theme.colors.black 
  },
  videoLoadingBox: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.gray100 
  },

  eraBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: theme.colors.background, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: theme.borderRadius.sm, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eraBadgeText: { 
    fontSize: theme.fontSize.sm, 
    color: theme.colors.error, 
    fontWeight: theme.fontWeight.medium 
  },
  storyText: { 
    fontSize: theme.fontSize.lg, 
    lineHeight: 26, 
    color: theme.colors.text, 
    marginBottom: 20,
    fontFamily: theme.fonts.body,
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  infoText: { 
    marginLeft: 10, 
    fontSize: theme.fontSize.md, 
    color: theme.colors.secondary, 
    flex: 1 
  },
  uploaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 20, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: theme.colors.border 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarPlaceholder: { 
    backgroundColor: theme.colors.gray100, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  uploaderName: { 
    marginLeft: 12, 
    fontSize: theme.fontSize.lg, 
    fontWeight: theme.fontWeight.medium, 
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  }
});