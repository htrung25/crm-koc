import { Pressable, StyleSheet, View } from 'react-native';

import { brand } from '@/shared/theme';
import type { AppHeaderProps } from '@/shared/types';

import { BrandLogo } from '@/shared/ui/brand-ui';
import { Text } from '@/shared/ui/text';

export function AppHeader({
  initial,
  avatarLabel,
  onAvatarPress,
  notificationsLabel,
  onNotificationsPress,
}: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <BrandLogo />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={notificationsLabel}
          onPress={onNotificationsPress}
          style={styles.bell}
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avatarLabel}
          onPress={onAvatarPress}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bell: {
    width: 40,
    height: 44,
    borderRadius: 12,
    backgroundColor: brand.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { color: brand.ink },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: brand.paper, fontSize: 15, fontWeight: '600' },
});
