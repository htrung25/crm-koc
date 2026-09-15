import { StyleSheet, View } from 'react-native';

import { brand } from '@/shared/theme';
import type { StatsHeroProps } from '@/shared/types';

import { Text } from '@/shared/ui/text';

export function StatsHero({
  eyebrow,
  title,
  subtitle,
  metrics,
}: StatsHeroProps) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>● {eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.metrics}>
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            style={[styles.metric, index > 0 && styles.metricDivider]}
          >
            <Text style={styles.value}>{metric.value}</Text>
            <Text style={styles.label}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 18, borderRadius: 18, backgroundColor: brand.hero },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: brand.live,
  },
  title: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: '600',
    color: brand.heroText,
  },
  subtitle: { marginTop: 6, fontSize: 12.5, color: brand.heroMuted },
  metrics: { flexDirection: 'row', marginTop: 16 },
  metric: { flex: 1, gap: 3 },
  metricDivider: {
    borderLeftWidth: 1,
    borderColor: brand.heroDivider,
    paddingLeft: 13,
  },
  value: { fontSize: 16, fontWeight: '600', color: brand.heroText },
  label: { fontSize: 10, color: brand.heroMuted },
});
