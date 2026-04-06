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
import { usePhotoStore } from '@/stores/photoStore';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const currentPhoto = usePhotoStore((state) => state.currentPhoto);
  const isLoading = usePhotoStore((state) => state.isLoading);
  const error = usePhotoStore((state) => state.error);
  const fetchPhotoDetail = usePhotoStore((state) => state.fetchPhotoDetail);
  const clearCurrentPhoto = usePhotoStore((state) => state.clearCurrentPhoto);

  useEffect(() => {
    if (id) {
      fetchPhotoDetail(id);
    }
    return () => {
      clearCurrentPhoto();
    };
  }, [id]);

  const handleBackPress = (): void => {
    router.back();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (isLoading && !currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  if (error && !currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => id && fetchPhotoDetail(id)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
        <Ionicons name="image-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Photo not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => id && fetchPhotoDetail(id)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              <ActivityIndicator size="large" color="#FF9800" />
            </View>
          )}
          {imageError ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#CCC" />
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
          {currentPhoto.era && (
            <View style={styles.eraBadge}>
              <Text style={styles.eraBadgeText}>{currentPhoto.era}</Text>
            </View>
          )}

          {currentPhoto.story && (
            <Text style={styles.storyText}>{currentPhoto.story}</Text>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {district.name || 'Unknown location'}
              {location.address ? ` · ${location.address}` : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="eye-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {(currentPhoto.viewCount || 0).toLocaleString()} views
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {currentPhoto.createdAt ? formatDate(currentPhoto.createdAt) : 'Unknown date'}
            </Text>
          </View>

          <View style={styles.uploaderRow}>
            {uploader.avatar ? (
              <Image source={{ uri: uploader.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#999" />
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
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollView: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 16 },
  backButton: { padding: 8 },
  backButtonOverlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#666', textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#FF9800', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  imageContainer: { width: SCREEN_WIDTH, height: 300, backgroundColor: '#F0F0F0', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageLoadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0', zIndex: 1 },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 16 },
  imageErrorText: { marginTop: 8, fontSize: 14, color: '#999' },
  content: { padding: 16 },
  eraBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
  eraBadgeText: { fontSize: 14, color: '#E65100', fontWeight: '500' },
  storyText: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#666', flex: 1 },
  uploaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  uploaderName: { marginLeft: 12, fontSize: 16, fontWeight: '500', color: '#333' }
});