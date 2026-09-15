import { StyleSheet, View } from 'react-native';

import { brand } from '@/shared/theme';
import type { StatusBadgeProps, StatusBadgeTone } from '@/shared/types';

import { Text } from '@/shared/ui/text';

const tones: Record<StatusBadgeTone, { background: string; color: string }> = {
  success: { background: brand.successSoft, color: brand.success },
  warning: { background: brand.warningSoft, color: brand.warning },
  danger: { background: brand.soft, color: brand.strong },
  neutral: { background: brand.canvas, color: brand.muted },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const { background, color } = tones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7 },
  label: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
});
