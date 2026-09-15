import { StyleSheet } from 'react-native';

import { brand } from '@/shared/theme';
import type { TabGlyphProps } from '@/shared/types';

import { Text } from '@/shared/ui/text';

/** Tab bar RedSun dùng chung cho giao diện Creator và Brand. */
export const tabBarScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: brand.primary,
  tabBarInactiveTintColor: brand.muted,
  tabBarStyle: { backgroundColor: brand.paper, borderTopColor: brand.border },
  tabBarLabelStyle: { fontSize: 10.5 },
};

export function TabGlyph({ glyph, color }: TabGlyphProps) {
  return <Text style={[styles.glyph, { color }]}>{glyph}</Text>;
}

const styles = StyleSheet.create({
  glyph: { fontSize: 21, lineHeight: 24 },
});
