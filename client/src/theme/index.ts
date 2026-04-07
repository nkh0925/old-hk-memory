export const colors = {
  primary: '#004B35',       
  secondary: '#666666',     
  background: '#F9F7F2',     
  text: '#222222',           
  error: '#B22222',          
  success: '#27AE60',        
  border: '#D1CDC0',         
  gray100: '#F7F9FC',
  gray200: '#EDF1F7',
  gray500: '#666666',        
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

export const fonts = {
  title: 'Georgia',
  body: 'System',       
} as const;

export const theme = {
  colors,
  spacing,
  fontSize,
  borderRadius,
  fontWeight,
  fonts,
} as const;

export type Theme = typeof theme;
export type Colors = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type BorderRadius = keyof typeof borderRadius;

export default theme;