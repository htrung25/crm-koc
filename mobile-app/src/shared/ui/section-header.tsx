import { StyleSheet, View } from 'react-native';

import { brand } from '@/shared/theme';
import type { SectionHeaderProps } from '@/shared/types';

import { TextAction } from '@/shared/ui/brand-ui';
import { Text } from '@/shared/ui/text';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <TextAction onPress={onAction}>{actionLabel}</TextAction>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: brand.ink },
});
