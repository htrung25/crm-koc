import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme, type TypographyVariant } from '@/shared/theme';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: 'default' | 'muted' | 'danger' | 'primary' | 'onPrimary';
};

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();

  const color = {
    default: colors.text,
    muted: colors.textMuted,
    danger: colors.danger,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
  }[tone];

  return <RNText style={[typography[variant] as TextStyle, { color }, style]} {...rest} />;
}
