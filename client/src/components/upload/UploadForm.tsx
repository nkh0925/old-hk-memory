import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from './ImagePicker';
import LocationPicker from './LocationPicker';
import { useDistrictStore } from '../../stores/districtStore';
import theme from '../../theme';   // 使用优化后的 Modern Archive theme
import type { Era } from '../../types/photos';

// ============================================================
// Types
// ============================================================

/**
 * Location coordinate interface
 */
interface LocationCoordinate {
  longitude: number;
  latitude: number;
}

/**
 * Upload form data interface
 */
export interface UploadFormData {
  image: string;
  longitude: number;
  latitude: number;
  districtCode: string;
  story?: string;
  era?: Era;
}

/**
 * Props interface for UploadForm component
 */
interface UploadFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: UploadFormData) => Promise<void>;
  /** Whether the form is in loading/submitting state */
  isLoading: boolean;
}

/**
 * Validation errors interface
 */
interface ValidationErrors {
  image?: string;
  location?: string;
  district?: string;
}

/**
 * Dropdown item interface
 */
interface DropdownItem<T extends string = string> {
  value: T;
  label: string;
}

// ============================================================
// Constants
// ============================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.5;
const MAX_STORY_LENGTH = 2000;

/**
 * Era options for dropdown
 */
const ERA_OPTIONS: DropdownItem<Era>[] = [
  { value: '1950s', label: '1950s' },
  { value: '1960s', label: '1960s' },
  { value: '1970s', label: '1970s' },
  { value: '1980s', label: '1980s' },
  { value: '1990s', label: '1990s' },
  { value: '2000s', label: '2000s' },
  { value: 'unknown', label: 'Unknown' },
];

// ============================================================
// Dropdown Select Component
// ============================================================

interface DropdownSelectProps<T extends string = string> {
  label: string;
  placeholder: string;
  value: T | null;
  options: DropdownItem<T>[];
  onSelect: (value: T) => void;
  error?: string;
  modalTitle: string;
}

function DropdownSelect<T extends string = string>({
  label,
  placeholder,
  value,
  options,
  onSelect,
  error,
  modalTitle,
}: DropdownSelectProps<T>): React.JSX.Element {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSelectItem = useCallback(
    (itemValue: T) => {
      onSelect(itemValue);
      setIsModalVisible(false);
    },
    [onSelect]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const selected = options.find((opt) => opt.value === value);
    return selected?.label ?? null;
  }, [value, options]);

  const renderItem = useCallback(
    ({ item }: { item: DropdownItem<T> }) => {
      const isSelected = item.value === value;

      return (
        <TouchableOpacity
          style={[styles.listItem, isSelected && styles.listItemSelected]}
          onPress={() => handleSelectItem(item.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
            {item.label}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [value, handleSelectItem]
  );

  const keyExtractor = useCallback((item: DropdownItem<T>) => item.value, []);

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownTrigger, !!error && styles.dropdownTriggerError]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownTriggerText,
            !selectedLabel && styles.dropdownPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.secondary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.backdrop} onPress={handleCloseModal}>
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparator}
              showsVerticalScrollIndicator
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * UploadForm component
 * Form for uploading old Hong Kong photos with metadata
 */
const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, isLoading }) => {
  // Form state
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationCoordinate | null>(null);
  const [districtCode, setDistrictCode] = useState<string | null>(null);
  const [story, setStory] = useState<string>('');
  const [era, setEra] = useState<Era | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // District store
  const { districts, fetchDistricts, isLoading: isLoadingDistricts } = useDistrictStore();

  // Fetch districts on mount
  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  /**
   * Convert districts to dropdown options
   */
  const districtOptions: DropdownItem<string>[] = useMemo(() => {
    return districts.map((d) => ({
      value: d.code,
      label: d.name,
    }));
  }, [districts]);

  /**
   * Handle image selection
   */
  const handleImageSelected = useCallback((uri: string): void => {
    setImage(uri);
    setErrors((prev) => ({ ...prev, image: undefined }));
  }, []);

  /**
   * Handle image clear
   */
  const handleImageClear = useCallback((): void => {
    setImage(null);
  }, []);

  /**
   * Handle location selection
   */
  const handleLocationSelected = useCallback(
    (loc: LocationCoordinate): void => {
      setLocation(loc);
      setErrors((prev) => ({ ...prev, location: undefined }));
    },
    []
  );

  /**
   * Handle district selection
   */
  const handleDistrictSelect = useCallback((code: string): void => {
    setDistrictCode(code);
    setErrors((prev) => ({ ...prev, district: undefined }));
  }, []);

  /**
   * Handle era selection
   */
  const handleEraSelect = useCallback((value: Era): void => {
    setEra(value);
  }, []);

  /**
   * Handle story text change
   */
  const handleStoryChange = useCallback((text: string): void => {
    if (text.length <= MAX_STORY_LENGTH) {
      setStory(text);
    }
  }, []);

  /**
   * Validate form before submission
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!image) {
      newErrors.image = 'Please select an image';
    }

    if (!location) {
      newErrors.location = 'Please select a location';
    }

    if (!districtCode) {
      newErrors.district = 'Please select a district';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [image, location, districtCode]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const formData: UploadFormData = {
      image: image!,
      longitude: location!.longitude,
      latitude: location!.latitude,
      districtCode: districtCode!,
      story: story.trim() || undefined,
      era: era || undefined,
    };

    await onSubmit(formData);
  }, [validateForm, image, location, districtCode, story, era, onSubmit]);

  /**
   * Check if submit button should be disabled
   */
  const isSubmitDisabled = isLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Image Picker Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Photo *</Text>
        <View style={styles.pickerContainer}>
          <ImagePicker
            image={image}
            onImageSelected={handleImageSelected}
            onClear={handleImageClear}
          />
        </View>
        {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
      </View>

      {/* Location Picker Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Location *</Text>
        <LocationPicker
          location={location}
          onLocationSelected={handleLocationSelected}
        />
        {location && (
          <Text style={styles.coordinatesText}>
            Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          </Text>
        )}
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
      </View>

      {/* District Dropdown Section */}
      {isLoadingDistricts ? (
        <View style={styles.section}>
          <Text style={styles.label}>District *</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading districts...</Text>
          </View>
        </View>
      ) : (
        <DropdownSelect<string>
          label="District *"
          placeholder="Select a district"
          value={districtCode}
          options={districtOptions}
          onSelect={handleDistrictSelect}
          error={errors.district}
          modalTitle="Select District"
        />
      )}

      {/* Era Dropdown Section */}
      <DropdownSelect<Era>
        label="Era (Optional)"
        placeholder="Select era"
        value={era}
        options={ERA_OPTIONS}
        onSelect={handleEraSelect}
        modalTitle="Select Era"
      />

      {/* Story Section */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Story (Optional)</Text>
          <Text style={styles.charCount}>
            {story.length}/{MAX_STORY_LENGTH}
          </Text>
        </View>
        <TextInput
          style={styles.storyInput}
          placeholder="Share the story behind this photo..."
          placeholderTextColor={theme.colors.secondary}
          value={story}
          onChangeText={handleStoryChange}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={MAX_STORY_LENGTH}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Upload Photo</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
  },
  pickerContainer: {
    alignItems: 'center',
  },
  coordinatesText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
  },

  // Dropdown Trigger - 档案式下拉
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownTriggerError: {
    borderColor: theme.colors.error,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  dropdownPlaceholder: {
    color: theme.colors.secondary,
  },

  // Modal - 档案卡片风格
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    width: '100%',
    maxWidth: 400,
    maxHeight: MAX_MODAL_HEIGHT,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },

  // List
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: theme.spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
  },
  listItemSelected: {
    backgroundColor: theme.colors.gray100,
  },
  listItemText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  listItemTextSelected: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },

  // Story Input - 旧表格风格
  storyInput: {
    height: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    textAlignVertical: 'top',
  },

  // Submit Button - Heritage Green 主色
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default UploadForm;