import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from 'src/stores/authStore';
import {
  generateVideo,
  checkVideoStatus,
  checkJobStatus,
  VideoStatus,
} from 'src/services/videoService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PhotoDetails {
  id: string;
  title?: string;
  imageUrl: string;
  story?: string;
  aiVideoStatus: VideoStatus;
  uploaderId?: string | null;
}

interface Props {
  visible: boolean;
  photo: PhotoDetails | null;
  distance: number;
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

// Polling interval in ms
const POLL_INTERVAL = 5000;
// Max polling attempts (5s × 72 = 6 min)
const MAX_ATTEMPTS = 72;

// ─── Component ─────────────────────────────────────────────────────────────────

export const ProximityAlertModal: React.FC<Props> = ({
  visible,
  photo,
  distance,
  onClose,
}) => {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'original' | 'custom'>('original');

  // ── Original Memory state ──
  // Initialized from photo.aiVideoStatus snapshot, then self-managed
  const [officialStatus, setOfficialStatus] = useState<VideoStatus>('none');
  const [officialError, setOfficialError] = useState<string | null>(null);
  const officialPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const officialAttempts = useRef(0);
  const isMounted = useRef(false);

  // ── My Recreation state ──
  const [customPrompt, setCustomPrompt] = useState('');
  const [customStatus, setCustomStatus] = useState<VideoStatus>('none');
  const [customError, setCustomError] = useState<string | null>(null);
  const [customJobId, setCustomJobId] = useState<string | null>(null);
  const customPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const customAttempts = useRef(0);

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset all state when modal opens with a new photo
  useEffect(() => {
    if (visible && photo) {
      setActiveTab('original');
      setOfficialStatus(photo.aiVideoStatus || 'none');
      setOfficialError(null);
      setCustomPrompt('');
      setCustomStatus('none');
      setCustomError(null);
      setCustomJobId(null);
      officialAttempts.current = 0;
      customAttempts.current = 0;
    }

    // Clean up polling when modal closes
    if (!visible) {
      stopOfficialPolling();
      stopCustomPolling();
    }
  }, [visible, photo?.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopOfficialPolling();
      stopCustomPolling();
    };
  }, []);

  // ─── Polling helpers ──────────────────────────────────────────────────────────

  const stopOfficialPolling = () => {
    if (officialPollTimer.current) {
      clearInterval(officialPollTimer.current);
      officialPollTimer.current = null;
    }
  };

  const stopCustomPolling = () => {
    if (customPollTimer.current) {
      clearInterval(customPollTimer.current);
      customPollTimer.current = null;
    }
  };

  // ─── Official Memory: Generate ────────────────────────────────────────────────

  const handleGenerateOfficial = async () => {
    if (!photo) return;

    setOfficialStatus('pending');
    setOfficialError(null);

    try {
      await generateVideo(photo.id, undefined, false);
      startOfficialPolling();
    } catch (err: any) {
      if (!isMounted.current) return;
      setOfficialStatus('failed');
      setOfficialError(err?.message || 'Failed to start video generation');
    }
  };

  const startOfficialPolling = () => {
    if (!photo) return;
    stopOfficialPolling();
    officialAttempts.current = 0;

    officialPollTimer.current = setInterval(async () => {
      if (!isMounted.current) {
        stopOfficialPolling();
        return;
      }

      officialAttempts.current += 1;

      if (officialAttempts.current > MAX_ATTEMPTS) {
        stopOfficialPolling();
        if (isMounted.current) {
          setOfficialStatus('failed');
          setOfficialError('Video generation timed out. Please try again.');
        }
        return;
      }

      try {
        const result = await checkVideoStatus(photo.id);
        if (!isMounted.current) return;

        setOfficialStatus(result.status);

        if (result.status === 'completed') {
          stopOfficialPolling();
        } else if (result.status === 'failed') {
          stopOfficialPolling();
          setOfficialError(result.error || 'Video generation failed');
        }
      } catch (err: any) {
        if (!isMounted.current) return;
        // Network hiccup — keep polling, don't stop
        console.warn('[ProximityAlertModal] Official poll error:', err?.message);
      }
    }, POLL_INTERVAL);
  };

  // ─── Official Memory: Play ────────────────────────────────────────────────────

  const handlePlayOfficial = () => {
    if (!photo) return;
    onClose();
    // Small delay to let modal close animation finish before navigating
    setTimeout(() => {
      router.push(`/photo/${photo.id}?autoPlay=true`);
    }, 300);
  };

  // ─── My Recreation: Generate ──────────────────────────────────────────────────

  const handleGenerateCustom = async () => {
    if (!photo || !customPrompt.trim()) return;

    setCustomStatus('pending');
    setCustomError(null);
    setCustomJobId(null);

    try {
      const result = await generateVideo(photo.id, customPrompt.trim(), true);
      if (!isMounted.current) return;

      setCustomJobId(result.jobId);
      setCustomStatus('pending');
      startCustomPolling(result.jobId);
    } catch (err: any) {
      if (!isMounted.current) return;
      setCustomStatus('failed');
      setCustomError(err?.message || 'Failed to start video generation');
    }
  };

  const startCustomPolling = (jobId: string) => {
    stopCustomPolling();
    customAttempts.current = 0;

    customPollTimer.current = setInterval(async () => {
      if (!isMounted.current) {
        stopCustomPolling();
        return;
      }

      customAttempts.current += 1;

      if (customAttempts.current > MAX_ATTEMPTS) {
        stopCustomPolling();
        if (isMounted.current) {
          setCustomStatus('failed');
          setCustomError('Video generation timed out. Check Profile → AI Videos later.');
        }
        return;
      }

      try {
        const result = await checkJobStatus(jobId);
        if (!isMounted.current) return;

        setCustomStatus(result.status);

        if (result.status === 'completed') {
          stopCustomPolling();
        } else if (result.status === 'failed') {
          stopCustomPolling();
          setCustomError(result.error || 'Video generation failed');
        }
      } catch (err: any) {
        if (!isMounted.current) return;
        // Network hiccup — keep polling, don't stop
        console.warn('[ProximityAlertModal] Custom poll error:', err?.message);
      }
    }, POLL_INTERVAL);
  };

  // ─── My Recreation: Go to Profile ─────────────────────────────────────────────

  const handleGoToProfile = () => {
    onClose();
    setTimeout(() => {
      router.push({
        pathname: '/(main)/profile',
        params: { tab: 'videos' },
      });
    }, 300);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────────

const isUploader =
  !!photo?.uploaderId &&
  !!currentUser?.id &&
  photo.uploaderId === currentUser.id;

  const formattedDistance = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderOfficialTab = () => {
    // completed — anyone can play
    if (officialStatus === 'completed') {
      return (
        <View style={styles.tabContent}>
          {photo?.story ? (
            <Text style={styles.storyText}>{photo.story}</Text>
          ) : (
            <Text style={styles.placeholderText}>No story available for this photo.</Text>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={handlePlayOfficial}>
            <Ionicons name="play-circle-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Play Historical AI Video</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // pending / processing — show spinner to everyone
    if (officialStatus === 'pending' || officialStatus === 'processing') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>
              {officialStatus === 'pending'
                ? 'Queued for generation...'
                : 'Generating AI video...'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            This may take a few minutes. You can close this and come back later.
          </Text>
        </View>
      );
    }

    // failed — uploader can retry, others see unavailable
    if (officialStatus === 'failed') {
      return (
        <View style={styles.tabContent}>
          {officialError && (
            <Text style={styles.errorText}>{officialError}</Text>
          )}
          {isUploader ? (
            <TouchableOpacity style={styles.warningButton} onPress={handleGenerateOfficial}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Retry Generation</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.unavailableText}>
              The historical AI video is currently unavailable.
            </Text>
          )}
        </View>
      );
    }

    // none — uploader can generate, others see not yet available
    return (
      <View style={styles.tabContent}>
        {photo?.story ? (
          <Text style={styles.storyText}>{photo.story}</Text>
        ) : (
          <Text style={styles.placeholderText}>No story available for this photo.</Text>
        )}
        {isUploader ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerateOfficial}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Generate Historical AI Video</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.unavailableText}>
            The historical AI video has not been generated yet.
          </Text>
        )}
      </View>
    );
  };

  const renderCustomTab = () => {
    // completed — show success state with link to profile
    if (customStatus === 'completed') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
            <Text style={styles.successText}>Your video is ready!</Text>
          </View>
          <TouchableOpacity style={styles.successButton} onPress={handleGoToProfile}>
            <Ionicons name="person-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View in Profile → AI Videos</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // pending / processing — show spinner, user can close modal
    if (customStatus === 'pending' || customStatus === 'processing') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>
              {customStatus === 'pending'
                ? 'Queued for generation...'
                : 'Generating your video...'}
            </Text>
          </View>
          <Text style={styles.hintText}>
            You can close this modal. Your video will be ready in Profile → AI Videos
            when complete.
          </Text>
          <TouchableOpacity style={styles.goToProfileButton} onPress={handleGoToProfile}>
            <Text style={styles.goToProfileText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // failed — show error + allow retry by resetting to none
    if (customStatus === 'failed') {
      return (
        <View style={styles.tabContent}>
          {customError && (
            <Text style={styles.errorText}>{customError}</Text>
          )}
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => {
              setCustomStatus('none');
              setCustomError(null);
              setCustomJobId(null);
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // none — show prompt input + generate button
    return (
      <View style={styles.tabContent}>
        <Text style={styles.instructionText}>
          Describe how you want to recreate this historical moment in your own style.
        </Text>
        <TextInput
          style={styles.promptInput}
          placeholder="e.g. Show this scene at golden hour with people walking..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          value={customPrompt}
          onChangeText={setCustomPrompt}
          maxLength={500}
        />
        <Text style={styles.charCount}>{customPrompt.length}/500</Text>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !customPrompt.trim() && styles.disabledButton,
          ]}
          onPress={handleGenerateCustom}
          disabled={!customPrompt.trim()}
        >
          <Ionicons name="sparkles-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Generate My Memory</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Guard ────────────────────────────────────────────────────────────────────

  if (!photo) return null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={18} color="#6366f1" />
              <Text style={styles.headerTitle}>Nearby Memory Discovered!</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.distanceText}>📍 {formattedDistance} away</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Photo image */}
            <Image
              source={{ uri: photo.imageUrl }}
              style={styles.photoImage}
              resizeMode="cover"
            />

            {/* Title */}
            {photo.title && (
              <Text style={styles.photoTitle}>{photo.title}</Text>
            )}

            {/* Tab bar */}
            <View style={styles.tabBar}>
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

            {/* Tab content */}
            {activeTab === 'original' ? renderOfficialTab() : renderCustomTab()}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  distanceText: {
    fontSize: 13,
    color: '#6b7280',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 160,
    gap: 12,
  },
  storyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  unavailableText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: -8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  goToProfileButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  goToProfileText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  dismissButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dismissText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});