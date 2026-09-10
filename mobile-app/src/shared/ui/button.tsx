import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/shared/theme';

import { Text } from './text';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const surface: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.primary }
      : variant === 'secondary'
        ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
        : { backgroundColor: 'transparent' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: radius.md, paddingHorizontal: spacing.lg },
        surface,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {/* Spinner phủ lên chữ để chiều rộng nút không nhảy khi loading */}
      {loading ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ActivityIndicator
            style={styles.spinner}
            color={variant === 'primary' ? colors.onPrimary : colors.primary}
          />
        </View>
      ) : null}
      <Text
        variant="label"
        tone={variant === 'primary' ? 'onPrimary' : 'primary'}
        style={loading ? styles.hidden : undefined}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  hidden: { opacity: 0 },
  spinner: { flex: 1 },
});
