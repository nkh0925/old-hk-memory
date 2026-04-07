/**
 * Loading component
 * Activity indicator with optional fullscreen overlay
 * Optimized for Modern Archive style (minimalist nostalgia)
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import theme from '../../theme';   // 使用优化后的完整 theme

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = theme.colors.primary,   // 默认使用 Heritage Green
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.overlay}>
          <ActivityIndicator size={size} color={color} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    zIndex: 999,
  },
  overlay: {
    backgroundColor: theme.colors.background,   // Paper White
    borderWidth: 1,
    borderColor: theme.colors.border,           // 柔和旧纸边框
    borderRadius: theme.borderRadius.sm,        // 微圆角，档案感
    padding: theme.spacing.xl,
  },
});

export default Loading;