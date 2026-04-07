/**
 * ErrorMessage component
 * Displays error message with optional retry action
 * Optimized for Modern Archive style (minimalist nostalgia - stamp-like)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';   // 使用优化后的完整 theme
import Button from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <Button
            title="Retry"
            onPress={onRetry}
            variant="outline"
            size="sm"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,   // Paper White
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.error,   // Stamp Red border
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,         // Stamp Red
    fontFamily: theme.fonts.title,     // Serif
  },
  message: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 26,
    fontFamily: theme.fonts.title,     // Serif for archival feel
  },
  buttonContainer: {
    marginTop: theme.spacing.sm,
  },
});

export default ErrorMessage;