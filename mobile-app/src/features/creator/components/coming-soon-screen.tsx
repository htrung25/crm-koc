import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand } from '@/shared/theme';
import { Artwork, Text } from '@/shared/ui';

export function ComingSoonScreen({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>
        <Artwork label={title} tone="sand" style={styles.art} />
        <Text style={styles.body}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: brand.ink },
  content: {
    flex: 1,
    padding: 18,
    gap: 16,
    justifyContent: 'center',
    backgroundColor: brand.canvas,
  },
  art: { height: 160, borderRadius: 18 },
  body: {
    fontSize: 13.5,
    lineHeight: 21,
    color: brand.muted,
    textAlign: 'center',
  },
});
