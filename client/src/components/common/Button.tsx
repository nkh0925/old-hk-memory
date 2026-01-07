/**
 * Button component
 * Customizable button with multiple variants and states
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
import { colors, spacing, fontSize, borderRadius } from '../../theme';

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
      ? colors.primary
      : colors.white;

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

// Variant styles mapping
const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

// Size styles mapping
const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
};

// Text variant styles mapping
const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.white,
  },
  outline: {
    color: colors.primary,
  },
  ghost: {
    color: colors.primary,
  },
};

// Text size styles mapping
const textSizeStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: fontSize.sm,
  },
  md: {
    fontSize: fontSize.md,
  },
  lg: {
    fontSize: fontSize.lg,
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  container_disabled: {
    backgroundColor: colors.gray200,
  },
  container_outline_disabled: {
    backgroundColor: 'transparent',
    borderColor: colors.gray200,
  },
  container_ghost_disabled: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '600',
  },
  text_disabled: {
    color: colors.gray500,
  },
});

export default Button;
