import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform
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
  onGenerateCustomVideo?: (prompt: string) => void; 
}

type TabType = 'original' | 'custom';

export const ProximityAlertModal: React.FC<ProximityAlertModalProps> = ({
  visible,
  photo,
  distance,
  onClose,
  onGenerateCustomVideo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('original');
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveTab('original');
      setCustomPrompt('');
    }
  }, [visible]);

  if (!photo) return null;

  const handleGenerateCustom = () => {
    if (customPrompt.trim().length === 0) return;
    if (onGenerateCustomVideo) {
      onGenerateCustomVideo(customPrompt.trim());
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Image */}
              <Image 
                source={{ uri: photo.imageUrl }} 
                style={styles.image}
                resizeMode="cover"
              />

              {/* Title */}
              <Text style={styles.storyTitle}>{photo.title || 'Historical Memory'}</Text>

              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'original' && styles.activeTab]}
                  onPress={() => setActiveTab('original')}
                >
                  <Text style={[styles.tabText, activeTab === 'original' && styles.activeTabText]}>
                    Original Memory
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
                  onPress={() => setActiveTab('custom')}
                >
                  <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
                    My Recreation
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.tabContentContainer}>
                {activeTab === 'original' ? (
                  <View style={styles.originalTrack}>
                    <Text style={styles.storyText}>
                      {photo.story || 'A piece of history resides here. Explore the past and uncover the hidden stories of old Hong Kong.'}
                    </Text>
                    
                    <TouchableOpacity style={styles.playOriginalButton}>
                      <Ionicons name="play-circle" size={24} color={theme.colors.white} style={styles.buttonIcon} />
                      <Text style={styles.primaryButtonText}>Play Historical AI Video</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.customTrack}>
                    <Text style={styles.customInstruction}>
                      Use your imagination! Describe what you would see if you were standing here decades ago, and let AI bring it to life.
                    </Text>
                    
                    <TextInput
                      style={styles.textInput}
                      multiline={true}
                      placeholder="e.g., Crowded streets with neon signs, people wearing traditional clothes..."
                      placeholderTextColor={theme.colors.gray500}
                      value={customPrompt}
                      onChangeText={setCustomPrompt}
                      textAlignVertical="top"
                    />

                    <TouchableOpacity 
                      style={[
                        styles.generateCustomButton, 
                        customPrompt.trim().length === 0 && styles.disabledButton
                      ]}
                      onPress={handleGenerateCustom}
                      disabled={customPrompt.trim().length === 0}
                    >
                      <Ionicons name="sparkles" size={20} color={theme.colors.white} style={styles.buttonIcon} />
                      <Text style={styles.primaryButtonText}>Generate My Memory</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
    maxHeight: '90%',
  },
  card: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    flexShrink: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.title,   // Serif 档案标题感
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    lineHeight: 18,
  },
  closeButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    flexShrink: 1,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  storyTitle: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray500,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  
  // Content Styles
  tabContentContainer: {
    paddingBottom: theme.spacing.md,
    minHeight: 180,
  },
  originalTrack: {
    flex: 1,
  },
  storyText: {
    fontSize: theme.fontSize.md,
    lineHeight: 26,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.fonts.body,
  },
  playOriginalButton: {
    backgroundColor: theme.colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  customTrack: {
    flex: 1,
  },
  customInstruction: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 100,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  generateCustomButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledButton: {
    backgroundColor: theme.colors.gray500,
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  
  // Footer
  footer: {
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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