import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';   // 使用优化后的 Modern Archive theme

// ============================================================
// Types
// ============================================================

/**
 * Props interface for ImagePicker component
 */
interface ImagePickerProps {
  /** Currently selected image URI */
  image: string | null;
  /** Callback when an image is selected */
  onImageSelected: (uri: string) => void;
  /** Callback when image is cleared */
  onClear: () => void;
}

/**
 * Image source type
 */
type ImageSource = 'camera' | 'gallery';

// ============================================================
// Constants
// ============================================================

/**
 * Image picker options - no cropping, slight compression
 */
const IMAGE_PICKER_OPTIONS: ExpoImagePicker.ImagePickerOptions = {
  mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
  allowsEditing: false, // No cropping
  quality: 0.8, // Slight compression for upload
  exif: false, // Don't include EXIF data
};

// ============================================================
// Component
// ============================================================

/**
 * ImagePicker component
 * Allows users to select images from camera or gallery
 */
const ImagePicker: React.FC<ImagePickerProps> = ({
  image,
  onImageSelected,
  onClear,
}) => {
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Request camera permission
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Request media library permission
   */
  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  /**
   * Launch camera to take a photo
   */
  const launchCamera = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const result = await ExpoImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [requestCameraPermission, onImageSelected]);

  /**
   * Launch gallery to pick an image
   */
  const launchGallery = useCallback(async (): Promise<void> => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [requestGalleryPermission, onImageSelected]);

  /**
   * Show action sheet to choose image source
   */
  const handleSelectImage = useCallback((): void => {
    Alert.alert(
      'Select Photo',
      'Choose a source for your photo',
      [
        {
          text: 'Camera',
          onPress: launchCamera,
        },
        {
          text: 'Gallery',
          onPress: launchGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [launchCamera, launchGallery]);

  /**
   * Handle clear button press
   */
  const handleClear = useCallback((): void => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onClear,
        },
      ],
      { cancelable: true }
    );
  }, [onClear]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </View>
    );
  }

  // Render image preview if image is selected
  if (image) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
          
          {/* Clear button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.8}
            accessibilityLabel="Remove photo"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={28} color={theme.colors.white} />
          </TouchableOpacity>

          {/* Change photo button */}
          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleSelectImage}
            activeOpacity={0.8}
            accessibilityLabel="Change photo"
            accessibilityRole="button"
          >
            <Ionicons name="camera" size={16} color={theme.colors.white} />
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render picker placeholder
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.placeholder}
        onPress={handleSelectImage}
        activeOpacity={0.7}
        accessibilityLabel="Select a photo"
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Ionicons name="camera-outline" size={48} color={theme.colors.secondary} />
        </View>
        <Text style={styles.placeholderText}>Tap to select a photo</Text>
        <Text style={styles.placeholderSubtext}>Camera or Gallery</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 300,
  },

  // Placeholder - 档案式占位
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  placeholderSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
  },

  // Preview
  previewContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  changeButtonText: {
    marginLeft: 4,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
});

export default ImagePicker;