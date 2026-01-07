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
              color="#007AFF"
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
        <ActivityIndicator size="small" color="#007AFF" />
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
        <Ionicons name="chevron-down" size={20} color="#666666" />
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
                <Ionicons name="close" size={24} color="#666666" />
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
  // Trigger Button
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    marginRight: 8,
  },
  loadingText: {
    fontSize: 15,
    color: '#666666',
    marginLeft: 8,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: MAX_MODAL_HEIGHT,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
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
    backgroundColor: '#E3F2FD',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  listItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  listItemCount: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 8,
  },
  listItemCountSelected: {
    color: '#007AFF',
  },
  checkIcon: {
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
  },
});

// Export memoized component
export default React.memo(DistrictFilter);
