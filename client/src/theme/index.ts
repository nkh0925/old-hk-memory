/**
 * Theme configuration
 * Centralized design tokens for consistent styling
 */

export const colors = {
  primary: '#E74C3C',
  secondary: '#3498DB',
  background: '#FFFFFF',
  text: '#2C3E50',
  error: '#E74C3C',
  success: '#27AE60',
  border: '#BDC3C7',
  gray100: '#F7F9FC',
  gray200: '#EDF1F7',
  gray500: '#8F9BB3',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const theme = {
  colors,
  spacing,
  fontSize,
  borderRadius,
  fontWeight,
} as const;

export type Theme = typeof theme;
export type Colors = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type BorderRadius = keyof typeof borderRadius;

export default theme;
