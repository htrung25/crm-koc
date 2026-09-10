import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '@/shared/theme';
import { Artwork, BrandButton, BrandLogo, Text, TextAction } from '@/shared/ui';
import { useCarousel } from '../hooks/use-carousel';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const { slide, setSlide } = useCarousel(3);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 18) }}
    >
      <View style={{ height: Math.max(260, height * 0.49) }}>
        <Artwork
          label={t(`redsun.slides.${slide}.image`)}
          tone={(['peach', 'sand', 'lilac'] as const)[slide]}
          style={{ flex: 1 }}
        />
        <View style={[styles.top, { top: insets.top + 10 }]}>
          <View style={styles.logo}>
            <BrandLogo />
          </View>
          <View style={styles.skip}>
            <TextAction onPress={() => router.replace('/')}>{t('redsun.skip')}</TextAction>
          </View>
        </View>
        <View style={styles.fade} />
      </View>
      <View style={styles.body}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t('redsun.slideNumber', { number: i + 1 })}
              accessibilityState={{ selected: slide === i }}
              onPress={() => setSlide(i)}
              style={styles.dotTarget}
            >
              <View
                style={{
                  height: 4,
                  width: slide === i ? 26 : 9,
                  borderRadius: 4,
                  backgroundColor: slide === i ? brand.primary : brand.border,
                }}
              />
            </Pressable>
          ))}
        </View>
        <View style={styles.copy}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{t(`redsun.slides.${slide}.tag`)}</Text>
          </View>
          <Text style={styles.title}>{t(`redsun.slides.${slide}.title`)}</Text>
          <Text style={styles.description}>{t(`redsun.slides.${slide}.body`)}</Text>
        </View>
        <BrandButton title={t('redsun.start')} onPress={() => router.push('/register')} />
        <BrandButton title={t('redsun.login')} secondary onPress={() => router.push('/sign-in')} />
        <Text style={styles.footnote}>{t('redsun.free')}</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  top: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { padding: 9, borderRadius: 28, backgroundColor: '#FFFFFFE8' },
  skip: { backgroundColor: '#FFFFFFE8', borderRadius: 24, paddingHorizontal: 15 },
  fade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#FFFFFF99',
  },
  body: { paddingHorizontal: 24, gap: 10, flex: 1 },
  dots: { flexDirection: 'row' },
  dotTarget: { width: 44, height: 44, justifyContent: 'center' },
  copy: { gap: 12, paddingBottom: 16 },
  tag: { alignSelf: 'flex-start', padding: 8, backgroundColor: brand.soft, borderRadius: 8 },
  tagText: { fontSize: 10.5, letterSpacing: 1, fontWeight: '600', color: brand.strong },
  title: { fontSize: 28, lineHeight: 35, fontWeight: '600', letterSpacing: -0.5, color: brand.ink },
  description: { fontSize: 14, lineHeight: 23, color: brand.muted },
  footnote: { marginTop: 4, textAlign: 'center', fontSize: 11, color: brand.muted },
});
