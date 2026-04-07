/**
 * Button component
 * Customizable button with multiple variants and states
 * Optimized for Modern Archive style (minimalist nostalgia)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import theme from '../../theme';   // 使用优化后的完整 theme

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): StyleProp<ViewStyle> => {
    const baseStyles: ViewStyle[] = [
      styles.container,
      variantStyles[variant],
      sizeStyles[size],
    ];

    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }

    if (isDisabled) {
      if (variant === 'outline') {
        baseStyles.push(styles.container_outline_disabled);
      } else if (variant === 'ghost') {
        baseStyles.push(styles.container_ghost_disabled);
      } else {
        baseStyles.push(styles.container_disabled);
      }
    }

    return baseStyles;
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const baseStyles: TextStyle[] = [
      styles.text,
      textVariantStyles[variant],
      textSizeStyles[size],
    ];

    if (isDisabled) {
      baseStyles.push(styles.text_disabled);
    }

    return baseStyles;
  };

  const spinnerColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : '#FFFFFF';

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Variant styles mapping (Modern Archive colors)
const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: theme.colors.primary,   // Heritage Green
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

// Size styles mapping (unchanged spacing)
const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 56,
  },
};

// Text variant styles
const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: '#FFFFFF',
  },
  outline: {
    color: theme.colors.primary,
  },
  ghost: {
    color: theme.colors.primary,
  },
};

// Text size styles
const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: theme.fontSize.sm,
  },
  md: {
    fontSize: theme.fontSize.md,
  },
  lg: {
    fontSize: theme.fontSize.lg,
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,   // 微圆角，更方正档案感
  },
  fullWidth: {
    width: '100%',
  },
  container_disabled: {
    backgroundColor: theme.colors.gray200,
  },
  container_outline_disabled: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.gray200,
  },
  container_ghost_disabled: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fonts.title,   // Serif for archival title feel
  },
  text_disabled: {
    color: theme.colors.gray500,
  },
});

export default Button;