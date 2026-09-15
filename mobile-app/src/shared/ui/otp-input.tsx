import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import type { OtpInputProps } from '@/shared/types';

import { Text } from '@/shared/ui/text';

export const OtpInput = forwardRef<TextInput, OtpInputProps>(function OtpInput(
  {
    value,
    onChangeText,
    length,
    label,
    error,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref
) {
  const { colors, radius, spacing } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text variant="label" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        // Bàn phím số vẫn dán được chữ nên phải lọc lại
        onChangeText={(text) =>
          onChangeText(text.replace(/\D/g, '').slice(0, length))
        }
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        placeholder={'0'.repeat(length)}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={[
          styles.field,
          {
            borderRadius: radius.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: focused ? colors.background : colors.surface,
            borderColor: error
              ? colors.danger
              : focused
                ? colors.primary
                : colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.5 },
  field: {
    minHeight: 48,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 12,
    fontVariant: ['tabular-nums'],
  },
});
