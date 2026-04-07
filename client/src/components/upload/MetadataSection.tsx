import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDistrictStore } from '../../stores/districtStore';
import theme from '../../theme';
import type { Era } from '../../types/photos';

interface DropdownItem<T extends string = string> {
  value: T;
  label: string;
}

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
}: DropdownSelectProps<T>) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOpenModal = useCallback(() => setIsModalVisible(true), []);
  const handleCloseModal = useCallback(() => setIsModalVisible(false), []);

  const handleSelectItem = useCallback((itemValue: T) => {
    onSelect(itemValue);
    setIsModalVisible(false);
  }, [onSelect]);

  const selectedLabel = useMemo(() => 
    options.find((opt) => opt.value === value)?.label ?? null, 
  [value, options]);

  const renderItem = useCallback(({ item }: { item: DropdownItem<T> }) => {
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
        {isSelected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
      </TouchableOpacity>
    );
  }, [value, handleSelectItem]);

  const keyExtractor = useCallback((item: DropdownItem<T>) => item.value, []);
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

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
              <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

// 主组件
interface MetadataSectionProps {
  districtCode: string | null;
  onDistrictChange: (code: string) => void;
  story: string;
  onStoryChange: (text: string) => void;
  era: Era | null;
  onEraChange: (value: Era) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const MetadataSection: React.FC<MetadataSectionProps> = ({
  districtCode,
  onDistrictChange,
  story,
  onStoryChange,
  era,
  onEraChange,
  onSubmit,
  isLoading,
}) => {
  const { districts, fetchDistricts, isLoading: isLoadingDistricts } = useDistrictStore();
  const MAX_STORY_LENGTH = 2000;

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const districtOptions: DropdownItem<string>[] = useMemo(() => 
    districts.map((d) => ({ value: d.code, label: d.name })), 
  [districts]);

  const ERA_OPTIONS: DropdownItem<Era>[] = [
    { value: '1950s', label: '1950s' },
    { value: '1960s', label: '1960s' },
    { value: '1970s', label: '1970s' },
    { value: '1980s', label: '1980s' },
    { value: '1990s', label: '1990s' },
    { value: '2000s', label: '2000s' },
    { value: 'unknown', label: 'Unknown' },
  ];

  return (
    <View style={styles.metadataCard}>
      {/* District */}
      {isLoadingDistricts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading districts...</Text>
        </View>
      ) : (
        <DropdownSelect<string>
          label="District *"
          placeholder="Select a district"
          value={districtCode}
          options={districtOptions}
          onSelect={onDistrictChange}
          modalTitle="Select District"
        />
      )}

      {/* Era */}
      <DropdownSelect<Era>
        label="Era (Optional)"
        placeholder="Select era"
        value={era}
        options={ERA_OPTIONS}
        onSelect={onEraChange}
        modalTitle="Select Era"
      />

      {/* Story */}
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
          onChangeText={onStoryChange}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={MAX_STORY_LENGTH}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Upload to Archive</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  metadataCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
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
  storyInput: {
    height: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
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
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },

  // Dropdown 样式
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
   errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
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
    maxHeight: 320,
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
});

export default MetadataSection;