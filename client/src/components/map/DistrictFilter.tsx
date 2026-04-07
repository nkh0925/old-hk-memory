/**
 * DistrictFilter Component
 * Dropdown select for filtering by district
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from 'src/theme';   // 使用优化后的 Modern Archive theme

// ============================================================
// Types
// ============================================================

/**
 * District region type
 */
export type DistrictRegion = 'hk_island' | 'kowloon' | 'new_territories';

/**
 * District data structure
 */
export interface District {
  /** Unique district code */
  code: string;
  /** Display name of the district */
  name: string;
  /** Region the district belongs to */
  region: DistrictRegion;
  /** Number of photos in this district */
  photosCount: number;
}

/**
 * Props for the DistrictFilter component
 */
export interface DistrictFilterProps {
  /** Array of districts to display */
  districts: District[];
  /** Currently selected district code, null for "All" */
  selectedCode: string | null;
  /** Callback when a district is selected */
  onSelect: (code: string | null) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
}

/**
 * List item type (includes "All" option)
 */
interface ListItem {
  code: string | null;
  name: string;
  photosCount: number;
}

// ============================================================
// Constants
// ============================================================

/** Label for the "All" filter option */
const ALL_DISTRICTS_LABEL = 'All Districts';

/** Screen dimensions for modal sizing */
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Maximum modal height as percentage of screen */
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;

// ============================================================
// Component
// ============================================================

/**
 * DistrictFilter component
 * Dropdown select for filtering photos by district
 */
const DistrictFilter: React.FC<DistrictFilterProps> = ({
  districts,
  selectedCode,
  onSelect,
  isLoading = false,
}) => {
  // Modal visibility state
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * Open the dropdown modal
   */
  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  /**
   * Close the dropdown modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  /**
   * Handle item selection
   */
  const handleSelectItem = useCallback(
    (code: string | null) => {
      onSelect(code);
      setIsModalVisible(false);
    },
    [onSelect]
  );

  /**
   * Calculate total photos count
   */
  const totalPhotosCount = useMemo(
    () => districts.reduce((sum, district) => sum + district.photosCount, 0),
    [districts]
  );

  /**
   * Build list data with "All" option first
   */
  const listData: ListItem[] = useMemo(() => {
    const allOption: ListItem = {
      code: null,
      name: ALL_DISTRICTS_LABEL,
      photosCount: totalPhotosCount,
    };

    const districtItems: ListItem[] = districts.map((d) => ({
      code: d.code,
      name: d.name,
      photosCount: d.photosCount,
    }));

    return [allOption, ...districtItems];
  }, [districts, totalPhotosCount]);

  /**
   * Get display text for trigger button
   */
  const selectedDisplayText = useMemo(() => {
    if (selectedCode === null) {
      return ALL_DISTRICTS_LABEL;
    }
    const selected = districts.find((d) => d.code === selectedCode);
    return selected ? selected.name : ALL_DISTRICTS_LABEL;
  }, [selectedCode, districts]);

  /**
   * Render individual list item
   */
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      const isSelected = item.code === selectedCode;

      return (
        <TouchableOpacity
          style={[styles.listItem, isSelected && styles.listItemSelected]}
          onPress={() => handleSelectItem(item.code)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
            {item.name}
          </Text>
          <Text style={[styles.listItemCount, isSelected && styles.listItemCountSelected]}>
            ({item.photosCount})
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.primary}
              style={styles.checkIcon}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedCode, handleSelectItem]
  );

  /**
   * Key extractor for FlatList
   */
  const keyExtractor = useCallback(
    (item: ListItem) => item.code ?? 'all',
    []
  );

  /**
   * Item separator component
   */
  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.triggerButton}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={handleOpenModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Selected district: ${selectedDisplayText}. Tap to change.`}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedDisplayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.secondary} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleCloseModal}>
          {/* Modal Content */}
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
              data={listData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparator}
              showsVerticalScrollIndicator={true}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// Set display name for debugging
DistrictFilter.displayName = 'DistrictFilter';

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Trigger Button - 档案式触发器
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    minWidth: 160,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginRight: 8,
    fontFamily: theme.fonts.body,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.secondary,
    marginLeft: 8,
  },

  // Modal - 干净档案卡风格
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: theme.fonts.title,   // Serif 档案标题感
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },

  // List
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listItemSelected: {
    backgroundColor: theme.colors.gray100,   // 柔和选中背景
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  },
  listItemTextSelected: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  listItemCount: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: 8,
  },
  listItemCountSelected: {
    color: theme.colors.primary,
  },
  checkIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
});

// Export memoized component
export default React.memo(DistrictFilter);