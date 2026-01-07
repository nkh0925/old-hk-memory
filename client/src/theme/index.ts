// Design system theme configuration

export const theme = {
  colors: {
    primary: '#B91C1C',
    secondary: '#F59E0B',
    background: '#FFFFFF',
    text: '#111827',
    error: '#DC2626',
    success: '#16A34A',
    border: '#E5E7EB',

    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  fontSize: {
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
} as const;

export type Theme = typeof theme;
