import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand } from '@/shared/theme';
import { Choice, SearchField, Text, TextAction } from '@/shared/ui';

import {
  byRecentUpdate,
  parseStatus,
  STATUS_KEY,
} from '@/features/brand/model/campaign';
import { brandCampaigns, statusCounts } from '@/features/brand/model/fixtures';
import { BrandCampaignRow } from '@/features/brand/components/brand-campaign-row';

export function BrandCampaignsScreen() {
  const { t } = useTranslation();
  // Bộ lọc nằm trên URL để tab Tổng quan mở thẳng đúng trạng thái
  const params = useLocalSearchParams<{ status?: string }>();
  const selected = parseStatus(params.status);
  const [search, setSearch] = useState('');

  const query = search.trim().toLocaleLowerCase();
  const campaigns = brandCampaigns
    .filter(
      (campaign) =>
        (selected === null || campaign.status === selected) &&
        `${campaign.title ?? ''} ${campaign.code}`
          .toLocaleLowerCase()
          .includes(query)
    )
    .sort(byRecentUpdate);
  const showComingSoon = () =>
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonBody'));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('tabs.campaigns')}</Text>
          <TextAction onPress={showComingSoon}>
            + {t('brand.createCampaign')}
          </TextAction>
        </View>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t('brand.campaigns.search')}
          clearLabel={t('redsun.clear')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Choice
            label={t('brand.campaigns.all', { total: brandCampaigns.length })}
            selected={selected === null}
            onPress={() => router.setParams({ status: '' })}
          />
          {statusCounts.map(({ status, count }) => (
            <Choice
              key={status}
              label={t('brand.campaigns.statusCount', {
                status: t(`brand.status.${STATUS_KEY[status]}`),
                total: count,
              })}
              selected={selected === status}
              onPress={() => router.setParams({ status: String(status) })}
            />
          ))}
        </ScrollView>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <BrandCampaignRow
              key={campaign.id}
              campaign={campaign}
              onPress={showComingSoon}
            />
          ))
        ) : (
          <Text style={styles.empty}>{t('brand.campaigns.empty')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  titleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: brand.ink },
  chips: { gap: 7 },
  list: {
    flexGrow: 1,
    backgroundColor: brand.canvas,
    padding: 18,
    gap: 10,
  },
  empty: {
    color: brand.muted,
    paddingVertical: 18,
    fontSize: 13,
    textAlign: 'center',
  },
});
