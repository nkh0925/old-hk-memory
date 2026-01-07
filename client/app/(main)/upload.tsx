// app/(main)/upload.tsx

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import UploadForm, { UploadFormData } from '../../src/components/upload/UploadForm';
import { usePhotoStore } from '../../src/stores/photoStore';
import { colors, spacing, fontSize, fontWeight } from '../../src/theme';

/**
 * Upload Photo Screen
 * Allows users to upload old Hong Kong photos with metadata
 */
export default function UploadScreen(): React.JSX.Element {
  // Photo store state and actions
  const uploadPhoto = usePhotoStore((state) => state.uploadPhoto);
  const isLoading = usePhotoStore((state) => state.isLoading);

  /**
   * Extract filename from URI
   */
  const getFilenameFromUri = useCallback((uri: string): string => {
    const uriParts = uri.split('/');
    const filename = uriParts[uriParts.length - 1];
    return filename || `photo_${Date.now()}.jpg`;
  }, []);

  /**
   * Get MIME type from URI or filename
   */
  const getMimeType = useCallback((uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'heic':
      case 'heif':
        return 'image/heic';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (formData: UploadFormData): Promise<void> => {
      try {
        // Convert image URI to the format expected by photoService
        const imageData = {
          uri: formData.image,
          type: getMimeType(formData.image),
          name: getFilenameFromUri(formData.image),
        };

        // Prepare upload params
        const uploadParams = {
          image: imageData,
          longitude: formData.longitude,
          latitude: formData.latitude,
          districtCode: formData.districtCode,
          story: formData.story,
          era: formData.era,
        };

        // Upload photo via store
        await uploadPhoto(uploadParams);

        // Success - show alert and navigate to home (map)
        Alert.alert(
          'Success',
          'Your photo has been uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to home/map tab
                router.replace('/(main)');
              },
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        // Error - show error alert
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to upload photo. Please try again.';

        Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
      }
    },
    [uploadPhoto, getMimeType, getFilenameFromUri]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Photo</Text>
      </View>

      {/* Upload Form */}
      <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
});
