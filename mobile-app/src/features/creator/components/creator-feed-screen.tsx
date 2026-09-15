import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { brand } from '@/shared/theme';
import { useAccountInitial } from '@/features/auth';
import { AppHeader, Choice, Text, TextAction } from '@/shared/ui';
import {
  campaigns,
  categories,
  creators,
  normalizeSearch,
  type Category,
} from '@/features/creator/model/discover-fixtures';
import { CampaignCard } from '@/features/creator/components/campaign-card';

export function CreatorFeedScreen() {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const query = normalizeSearch(search);
  const initial = useAccountInitial();
  const showComingSoon = () =>
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonBody'));
  const viewCampaigns = () => router.push('/creator/campaigns');
  const matches = (itemCategory: string, value: string) =>
    (category === 'all' || category === itemCategory) &&
    normalizeSearch(value).includes(query);
  const visibleCampaigns = campaigns.filter((c) =>
    matches(
      c.category,
      `${t(c.titleKey)} ${c.brand} ${t(`redsun.categories.${c.category}`)}`
    )
  );
  const visibleCreators = creators.filter((c) =>
    matches(
      c.category,
      `${c.name} ${c.platform} ${t(`redsun.categories.${c.category}`)}`
    )
  );
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <AppHeader
          initial={initial}
          avatarLabel={t('tabs.account')}
          onAvatarPress={() => router.push('/creator/account')}
          notificationsLabel={t('redsun.notifications')}
          onNotificationsPress={showComingSoon}
        />
        <View style={styles.search}>
          <Text style={{ color: brand.muted, fontSize: 24 }}>⌕</Text>
          <TextInput
            accessibilityLabel={t('redsun.search')}
            placeholder={t('redsun.search')}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={brand.muted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search ? (
            <TextAction label={t('redsun.clear')} onPress={() => setSearch('')}>
              ×
            </TextAction>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((c) => (
            <Choice
              key={c}
              label={t(`redsun.categories.${c}`)}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </ScrollView>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feed}
        keyboardShouldPersistTaps="handled"
      >
        {!search && category === 'all' ? (
          <View style={styles.hero}>
            <Text style={styles.live}>● {t('redsun.live')}</Text>
            <Text style={styles.heroTitle}>Mega Live Sale · Beauty Q3</Text>
            <Text style={styles.heroSubtitle}>{t('redsun.match')}</Text>
            <View style={styles.metrics}>
              {[
                ['1.42', 'gmv'],
                ['184', 'participants'],
                ['4.85%', 'conversion'],
              ].map(([value, label], index) => (
                <View
                  key={label}
                  style={[styles.metric, index > 0 && styles.metricBorder]}
                >
                  <Text style={styles.metricValue}>
                    {label === 'gmv' ? t('redsun.billion', { value }) : value}
                  </Text>
                  <Text style={styles.metricLabel}>{t(`redsun.${label}`)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{t('redsun.featured')}</Text>
            <TextAction onPress={viewCampaigns}>
              {t('redsun.viewAll')}
            </TextAction>
          </View>
          {visibleCampaigns.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
              snapToInterval={236}
              decelerationRate="fast"
            >
              {visibleCampaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onPress={showComingSoon}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.empty}>{t('redsun.emptyCampaigns')}</Text>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>{t('redsun.topKoc')}</Text>
            <Text style={styles.meta}>{t('redsun.sevenDays')}</Text>
          </View>
          {visibleCreators.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={showComingSoon}
              style={({ pressed }) => [
                styles.creator,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[styles.avatar, { backgroundColor: brand[c.color] }]}
              >
                <Text style={styles.avatarText}>{c.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>{c.name}</Text>
                <Text style={styles.meta}>{c.platform}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.creatorName}>
                  {new Intl.NumberFormat(i18n.language, {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(c.gmv)}
                </Text>
                <Text style={styles.meta}>VNĐ</Text>
              </View>
            </Pressable>
          ))}
          {!visibleCreators.length ? (
            <Text style={styles.empty}>{t('redsun.emptyCreators')}</Text>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brands}
        >
          {[
            'VINAMILK',
            'SUNHOUSE',
            'COOLMATE',
            'LEMONADE',
            'ANKER',
            'BASEUS',
          ].map((name) => (
            <Text key={name} style={styles.brand}>
              {name}
            </Text>
          ))}
        </ScrollView>
        <View style={styles.promo}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
            {t('creator.hero.title')}
          </Text>
          <Text style={[styles.meta, { textAlign: 'center', lineHeight: 21 }]}>
            {t('creator.hero.subtitle')}
          </Text>
          <TextAction onPress={viewCampaigns}>
            {t('tabs.myCampaigns')} →
          </TextAction>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: brand.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: brand.ink,
    fontSize: 13,
    paddingVertical: 12,
  },
  feed: {
    backgroundColor: brand.canvas,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 22,
  },
  hero: {
    marginHorizontal: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: brand.hero,
  },
  live: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: brand.live,
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: '600',
    color: brand.heroText,
  },
  heroSubtitle: { marginTop: 6, fontSize: 12.5, color: brand.heroMuted },
  metrics: { flexDirection: 'row', marginTop: 16 },
  metric: { flex: 1, gap: 3 },
  metricBorder: { borderLeftWidth: 1, borderColor: '#61453B', paddingLeft: 13 },
  metricValue: { fontSize: 16, fontWeight: '600', color: brand.heroText },
  metricLabel: { fontSize: 10, color: brand.heroMuted },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: brand.ink },
  horizontal: { paddingHorizontal: 18, gap: 12 },
  section: { paddingHorizontal: 18, gap: 10 },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: brand.paper,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: brand.paper, fontWeight: '600', fontSize: 15 },
  creatorName: { color: brand.ink, fontSize: 13, fontWeight: '600' },
  meta: { color: brand.muted, fontSize: 11.5 },
  brands: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 22,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  brand: { color: brand.muted, fontSize: 11, letterSpacing: 1 },
  promo: {
    marginHorizontal: 18,
    padding: 18,
    gap: 8,
    backgroundColor: brand.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
  },
  empty: { color: brand.muted, padding: 18, fontSize: 13 },
});
