/**
 * Avatar component
 * User avatar with image or fallback initials
 */

import React from 'react';
import {
  View,
  Text,
  Image,
//   StyleSheet,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, fontSize } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: fontSize.sm,
  md: fontSize.lg,
  lg: fontSize.xxl,
};

/**
 * Extract initials from a name string
 * @param name - Full name string
 * @returns Uppercase initials (max 2 characters)
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'md',
}) => {
  const dimension = sizeMap[size];
  const textSize = fontSizeMap[size];

  // If we have a valid URI, show the image
  if (uri) {
    const imageStyle: ImageStyle = {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      backgroundColor: colors.gray200,
    };

    return (
      <Image
        source={{ uri }}
        style={imageStyle}
      />
    );
  }

  // Otherwise, show initials fallback
  const initials = name ? getInitials(name) : '?';

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const textStyle: TextStyle = {
    fontSize: textSize,
    color: colors.white,
    fontWeight: '600',
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{initials}</Text>
    </View>
  );
};

export default Avatar;
