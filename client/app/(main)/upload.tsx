import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import UploadForm, { UploadFormData } from '../../src/components/upload/UploadForm';
import { usePhotoStore } from '../../src/stores/photoStore';
import theme from 'src/theme';

/**
 * Upload Photo Screen
 * Allows users to upload old Hong Kong photos with metadata
 */
export default function UploadScreen(): React.JSX.Element {
  const uploadPhoto = usePhotoStore((state) => state.uploadPhoto);
  const isLoading = usePhotoStore((state) => state.isLoading);

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

  const handleSubmit = useCallback(
    async (formData: UploadFormData): Promise<void> => {
      try {
        const imageData = {
          uri: formData.image,
          type: getMimeType(formData.image),
          name: getFilenameFromUri(formData.image),
        };

        const uploadParams = {
          image: imageData,
          longitude: formData.longitude,
          latitude: formData.latitude,
          districtCode: formData.districtCode,
          story: formData.story,
          era: formData.era,
        };

        await uploadPhoto(uploadParams);

        Alert.alert(
          'Success',
          'Your photo has been uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(main)');
              },
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.';
        Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
      }
    },
    [uploadPhoto, getMimeType, getFilenameFromUri]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Photo</Text>
      </View>
      <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.title,   // Serif
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});