import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from 'src/theme';

export interface PhotoDetails {
  id: string;
  title?: string;
  imageUrl: string;
  story?: string;
  aiVideoStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ProximityAlertModalProps {
  visible: boolean;
  photo: PhotoDetails | null;
  distance: number; // in meters
  onClose: () => void;
}

export const ProximityAlertModal: React.FC<ProximityAlertModalProps> = ({
  visible,
  photo,
  distance,
  onClose,
}) => {
  if (!photo) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>📍 Nearby Memory Discovered!</Text>
                <Text style={styles.subtitle}>
                  Only {Math.round(distance)}m away from where you stand.
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.gray500} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {/* Image */}
              <Image 
                source={{ uri: photo.imageUrl }} 
                style={styles.image}
                resizeMode="cover"
              />

              {/* Story Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.storyTitle}>{photo.title || 'Historical Memory'}</Text>
                <Text style={styles.storyText}>
                  {photo.story || 'A piece of history resides here. Explore the past and uncover the hidden stories of old Hong Kong.'}
                </Text>
              </View>
            </ScrollView>

            {/* Action Placeholder */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="sparkles" size={20} color={theme.colors.white} style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>
                  AI Features (Coming in Task 12)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
                <Text style={styles.dismissButtonText}>Not Now</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end', // Aligns the card to the bottom
  },
  safeArea: {
    width: '100%',
    maxHeight: '85%', // Prevent it from covering the entire screen
  },
  card: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg * 2,
    borderTopRightRadius: theme.borderRadius.lg * 2,
    padding: theme.spacing.lg,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
  },
  closeButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.full,
  },
  scrollContent: {
    flexShrink: 1,
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.gray200,
  },
  contentContainer: {
    paddingBottom: theme.spacing.sm,
  },
  storyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  storyText: {
    fontSize: theme.fontSize.md,
    lineHeight: 24,
    color: theme.colors.text,
  },
  footer: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
});