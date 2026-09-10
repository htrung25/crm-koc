import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { brand } from '@/shared/theme';
import { Text } from './text';

export function BrandLogo() {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>R</Text>
      </View>
      <Text style={styles.brandName}>RedSun CRM</Text>
    </View>
  );
}

export function BrandButton({
  title,
  onPress,
  secondary = false,
  dark = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  dark?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? brand.paper : dark ? brand.ink : brand.primary,
          borderColor: secondary ? brand.border : 'transparent',
          opacity: pressed || disabled ? 0.65 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? brand.ink : brand.heroText }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TextAction({
  children,
  onPress,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Text style={styles.link}>{children}</Text>
    </Pressable>
  );
}

export function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choice, { backgroundColor: selected ? brand.ink : brand.canvas }]}
    >
      <Text
        style={{ fontSize: 13, fontWeight: '500', color: selected ? brand.paper : brand.muted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** The supplied design uses striped image placeholders, not product photography. */
export function Artwork({
  label,
  tone = 'peach',
  style,
}: {
  label: string;
  tone?: 'peach' | 'sand' | 'lilac';
  style?: ViewStyle;
}) {
  const colors = {
    peach: [brand.peach, brand.peachStripe],
    sand: [brand.sand, brand.sandStripe],
    lilac: [brand.lilac, brand.lilacStripe],
  }[tone];
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.art, { backgroundColor: colors[0] }, style]}
    >
      <View pointerEvents="none" style={styles.stripes}>
        {Array.from({ length: 40 }, (_, i) => (
          <View
            key={i}
            style={{ width: 14, height: '200%', backgroundColor: colors[1], marginRight: 14 }}
          />
        ))}
      </View>
      <Text style={styles.artLabel}>{label}</Text>
    </View>
  );
}

export function PageHeader({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack: () => void;
  trailing?: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('redsun.back')}
        onPress={onBack}
        style={styles.back}
      >
        <Text style={{ color: brand.ink, fontSize: 22 }}>←</Text>
      </Pressable>
      <Text style={styles.brandName}>{title}</Text>
      <Text style={styles.trailing}>{trailing}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: brand.paper, fontSize: 15, fontWeight: '700' },
  brandName: { fontSize: 15, fontWeight: '600', color: brand.ink },
  button: {
    minHeight: 54,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  link: { fontSize: 13, fontWeight: '500', color: brand.primary },
  choice: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  art: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  stripes: {
    position: 'absolute',
    flexDirection: 'row',
    width: 1100,
    height: '200%',
    transform: [{ rotate: '25deg' }],
  },
  artLabel: { color: brand.muted, fontSize: 11, letterSpacing: 0.8, textAlign: 'center' },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomColor: brand.border,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
  },
  back: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: { marginLeft: 'auto', color: brand.muted, fontSize: 12 },
});
