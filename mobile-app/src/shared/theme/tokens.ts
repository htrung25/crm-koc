export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

export type TypographyVariant = keyof typeof typography;

const palette = {
  brand: '#208AEF',
  brandDark: '#4AA3F5',
  danger: '#DC2626',
  dangerDark: '#F87171',
  success: '#16A34A',
  successDark: '#4ADE80',
} as const;

export type Colors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
};

export const lightColors: Colors = {
  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: palette.brand,
  onPrimary: '#FFFFFF',
  danger: palette.danger,
  success: palette.success,
};

export const darkColors: Colors = {
  background: '#0B1120',
  surface: '#151E31',
  border: '#233047',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  primary: palette.brandDark,
  onPrimary: '#08121F',
  danger: palette.dangerDark,
  success: palette.successDark,
};
