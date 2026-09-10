import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Bật khi nội dung dài hơn màn hình hoặc có form cần tránh bàn phím. */
  scrollable?: boolean;
  /** Tắt khi màn hình nằm trong navigator đã tự chừa safe area. */
  edges?: { top?: boolean; bottom?: boolean };
};

export function Screen({ children, scrollable = false, edges }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: edges?.top === false ? 0 : insets.top,
    paddingBottom: edges?.bottom === false ? 0 : insets.bottom,
    paddingHorizontal: spacing.lg,
  };

  const background = { backgroundColor: colors.background };

  if (!scrollable) {
    return <View style={[styles.flex, background, padding]}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, background]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, padding]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
