import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoStore } from '../../src/stores/photoStore';
import theme from 'src/theme';
import ImagePicker from '../../src/components/upload/ImagePicker';
import LocationPicker from '../../src/components/upload/LocationPicker';
import MetadataSection from '../../src/components/upload/MetadataSection';

export default function UploadScreen(): React.JSX.Element {
  const uploadPhoto = usePhotoStore((state) => state.uploadPhoto);
  const isLoading = usePhotoStore((state) => state.isLoading);

  // 折叠状态
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);

  // 表单数据
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [districtCode, setDistrictCode] = useState<string | null>(null);
  const [story, setStory] = useState<string>('');
  const [era, setEra] = useState<any>(null);

  const getFilenameFromUri = useCallback((uri: string): string => {
    const uriParts = uri.split('/');
    const filename = uriParts[uriParts.length - 1];
    return filename || `photo_${Date.now()}.jpg`;
  }, []);

  const getMimeType = useCallback((uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'heic':
      case 'heif': return 'image/heic';
      case 'jpg':
      case 'jpeg':
      default: return 'image/jpeg';
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!image || !location || !districtCode) {
      Alert.alert('Incomplete', 'Please complete Photo, Location and District fields.');
      return;
    }

    try {
      const imageData = {
        uri: image,
        type: getMimeType(image),
        name: getFilenameFromUri(image),
      };

      const uploadParams = {
        image: imageData,
        longitude: location.longitude,
        latitude: location.latitude,
        districtCode,
        story: story.trim() || undefined,
        era,
      };

      await uploadPhoto(uploadParams);

      Alert.alert(
        'Success',
        'Your photo has been uploaded successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(main)') }],
        { cancelable: false }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.';
      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    }
  }, [image, location, districtCode, story, era, uploadPhoto, getMimeType, getFilenameFromUri]);

  return (
    <View style={styles.container}>
      {/* Header - 档案标题风格 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Archive Photo</Text>
        <Text style={styles.headerSubtitle}>Add to Hong Kong Memory Collection</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Section - 独立折叠卡片 */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => setIsImageExpanded(!isImageExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTitleRow}>
              <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Photo *</Text>
            </View>
            <Ionicons 
              name={isImageExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.secondary} 
            />
          </TouchableOpacity>

          {isImageExpanded ? (
            <View style={styles.cardContent}>
              <ImagePicker
                image={image}
                onImageSelected={setImage}
                onClear={() => setImage(null)}
              />
            </View>
          ) : (
            <View style={styles.cardSummary}>
              {image ? (
                <Text style={styles.summaryText}>✅ Photo selected</Text>
              ) : (
                <Text style={styles.summaryPlaceholder}>Tap to select a photo from camera or gallery</Text>
              )}
            </View>
          )}
        </View>

        {/* Location Section - 独立折叠卡片 */}
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => setIsLocationExpanded(!isLocationExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTitleRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Location *</Text>
            </View>
            <Ionicons 
              name={isLocationExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.secondary} 
            />
          </TouchableOpacity>

          {isLocationExpanded ? (
            <View style={styles.cardContent}>
              <LocationPicker
                location={location}
                onLocationSelected={setLocation}
              />
            </View>
          ) : (
            <View style={styles.cardSummary}>
              {location ? (
                <Text style={styles.summaryText}>
                  ✅ Location set • Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                </Text>
              ) : (
                <Text style={styles.summaryPlaceholder}>Tap to set location via map or current GPS</Text>
              )}
            </View>
          )}
        </View>

        {/* Metadata Section - 始终可见，紧凑档案风格 */}
        <MetadataSection
          districtCode={districtCode}
          onDistrictChange={setDistrictCode}
          story={story}
          onStoryChange={setStory}
          era={era}
          onEraChange={setEra}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardSummary: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  summaryText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  summaryPlaceholder: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
});