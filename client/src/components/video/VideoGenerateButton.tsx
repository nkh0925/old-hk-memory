/**
 * VideoGenerateButton Component
 * Handles AI video generation states and actions for a historical photo
 * Built for React Native (Expo) with expo-av video playback
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import videoService from '../../services/videoService';
import type { VideoStatusResponse } from '../../services/videoService';
import theme from 'src/theme';   // 使用优化后的 Modern Archive theme

// ============================================================
// Types
// ============================================================

interface AiVideoProp {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
}

interface Props {
  photoId: string;
  aiVideo: AiVideoProp;
  onStatusChange?: () => void;
}

type ButtonVariant = 'primary' | 'success' | 'warning' | 'disabled';

interface ButtonConfig {
  text: string;
  onPress?: () => void;
  disabled: boolean;
  variant: ButtonVariant;
  showSpinner: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================
// Component
// ============================================================

const VideoGenerateButton: React.FC<Props> = ({
  photoId,
  aiVideo,
  onStatusChange,
}) => {
  const [currentStatus, setCurrentStatus] = useState(aiVideo.status);
  const [videoUrl, setVideoUrl] = useState(aiVideo.url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Video Modal State ────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const videoRef = useRef<Video>(null);

  // ── Sync external aiVideo prop changes ──────────────────────
  useEffect(() => {
    setCurrentStatus(aiVideo.status);
    setVideoUrl(aiVideo.url);
  }, [aiVideo.status, aiVideo.url]);

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ── Polling logic ────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;

      try {
        const statusResponse: VideoStatusResponse =
          await videoService.checkVideoStatus(photoId);

        if (!isMountedRef.current) return;

        setCurrentStatus(statusResponse.status);

        if (statusResponse.videoUrl) {
          setVideoUrl(statusResponse.videoUrl);
        }

        setError(null);

        // Stop polling when terminal state is reached
        if (
          statusResponse.status === 'completed' ||
          statusResponse.status === 'failed'
        ) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          onStatusChange?.();
        }
      } catch (err) {
        // Continue polling even if a single check fails
        console.error('[VideoGenerateButton] Polling error:', err);
      }
    }, 5000);
  }, [photoId, onStatusChange]);

  // ── Video Modal Handlers ─────────────────────────────────────
  const handleOpenModal = () => {
    if (!videoUrl) return;
    setVideoError(false);
    setVideoLoading(true);
    setModalVisible(true);
  };

  const handleCloseModal = async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync().catch(() => {});
    }
    setModalVisible(false);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[VideoGenerateButton] Playback error:', status.error);
        setVideoError(true);
        setVideoLoading(false);
      }
      return;
    }

    if (status.isLoaded && videoLoading) {
      setVideoLoading(false);
    }
  };

  // ── Generate / Retry Handlers ────────────────────────────────
  const handleGenerateVideo = async () => {
    setLoading(true);
    setError(null);

    try {
      await videoService.generateVideo(photoId);
      setCurrentStatus('pending');
      startPolling();
    } catch (err: any) {
      setError(err?.message || 'Failed to start video generation');
      console.error('[VideoGenerateButton] Generate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerateVideo();
  };

  // ── Button config per status ─────────────────────────────────
  const getButtonConfig = (): ButtonConfig => {
    switch (currentStatus) {
      case 'none':
        return {
          text: 'Generate Video',
          onPress: handleGenerateVideo,
          disabled: loading,
          variant: 'primary',
          showSpinner: loading,
        };
      case 'pending':
        return {
          text: 'Queued...',
          onPress: undefined,
          disabled: true,
          variant: 'disabled',
          showSpinner: true,
        };
      case 'processing':
        return {
          text: 'Generating...',
          onPress: undefined,
          disabled: true,
          variant: 'disabled',
          showSpinner: true,
        };
      case 'completed':
        return {
          text: 'Play Video',
          onPress: handleOpenModal,
          disabled: false,
          variant: 'success',
          showSpinner: false,
        };
      case 'failed':
        return {
          text: 'Retry',
          onPress: handleRetry,
          disabled: loading,
          variant: 'warning',
          showSpinner: loading,
        };
      default:
        return {
          text: 'Generate Video',
          onPress: handleGenerateVideo,
          disabled: loading,
          variant: 'primary',
          showSpinner: loading,
        };
    }
  };

  const config = getButtonConfig();

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      {/* Main Action Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles[config.variant],
          config.disabled && styles.buttonDisabled,
        ]}
        onPress={config.onPress}
        disabled={config.disabled}
        activeOpacity={0.8}
      >
        {config.showSpinner && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.spinner}
          />
        )}
        <Text style={styles.buttonText}>{config.text}</Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Ready Hint */}
      {currentStatus === 'completed' && videoUrl && (
        <Text style={styles.readyText}>Video is ready to play</Text>
      )}

      {/* Video Playback Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseModal}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Video Player */}
          {videoUrl && !videoError && (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          )}

          {/* Video Loading Overlay */}
          {videoLoading && !videoError && (
            <View style={styles.videoOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.videoLoadingText}>Loading video...</Text>
            </View>
          )}

          {/* Video Error State */}
          {videoError && (
            <View style={styles.videoOverlay}>
              <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
              <Text style={styles.videoErrorText}>Failed to load video</Text>
              <TouchableOpacity
                style={styles.retryVideoButton}
                onPress={() => {
                  setVideoError(false);
                  setVideoLoading(true);
                }}
              >
                <Text style={styles.retryVideoButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// ============================================================
// Styles (Modern Archive optimized)
// ============================================================

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.sm,   // 微圆角，档案感
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primary: {
    backgroundColor: theme.colors.primary,   // Heritage Green
  },
  success: {
    backgroundColor: '#27AE60',   // 保留温和 success 绿，与 theme 协调
  },
  warning: {
    backgroundColor: theme.colors.error,     // Stamp Red
  },
  disabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fonts.body,
  },
  spinner: {
    marginRight: 8,
  },

  // Feedback
  errorContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
  },
  readyText: {
    fontSize: theme.fontSize.sm,
    color: '#27AE60',
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },

  // Video Overlay
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 12,
  },
  videoLoadingText: {
    color: '#FFF',
    fontSize: theme.fontSize.md,
    marginTop: 8,
  },
  videoErrorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.lg,
    marginTop: 8,
  },
  retryVideoButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,   // 统一为 Heritage Green
    borderRadius: theme.borderRadius.sm,
  },
  retryVideoButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default VideoGenerateButton;