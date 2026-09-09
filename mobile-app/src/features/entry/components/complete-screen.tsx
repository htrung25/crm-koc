import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand } from '@/shared/theme';
import { BrandButton, Text } from '@/shared/ui';

export function CompleteScreen() {
  const { t } = useTranslation();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.check}>
        <Text style={styles.checkText}>✓</Text>
      </View>
      <Text style={styles.title}>
        {t(kind === 'login' ? 'redsun.loginComplete' : 'redsun.registerComplete')}
      </Text>
      <Text style={styles.body}>{t('redsun.completeBody')}</Text>
      <BrandButton title={t('redsun.backHome')} secondary onPress={() => router.dismissTo('/')} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.paper,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 24,
  },
  check: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: brand.paper, fontSize: 36, lineHeight: 44 },
  title: { color: brand.ink, fontSize: 24, lineHeight: 31, fontWeight: '600', textAlign: 'center' },
  body: { maxWidth: 300, color: brand.muted, fontSize: 14, lineHeight: 23, textAlign: 'center' },
});
