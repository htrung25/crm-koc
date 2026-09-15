import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAccountInitial } from '@/features/auth';
import { brand } from '@/shared/theme';
import {
  AppHeader,
  BrandButton,
  SectionHeader,
  StatsHero,
  StatusBadge,
  Text,
} from '@/shared/ui';

import {
  byRecentUpdate,
  STATUS_KEY,
  STATUS_TONE,
} from '@/features/brand/model/campaign';
import {
  activeCollaborationCount,
  brandCampaigns,
  statusCounts,
} from '@/features/brand/model/fixtures';
import {
  CAMPAIGN_STATUS,
  type CampaignStatus,
} from '@/features/brand/model/types';
import { BrandCampaignRow } from '@/features/brand/components/brand-campaign-row';

const ATTENTION_STATUSES: CampaignStatus[] = [
  CAMPAIGN_STATUS.CHANGES_REQUESTED,
  CAMPAIGN_STATUS.REJECTED,
  CAMPAIGN_STATUS.DRAFT,
];

function countOf(status: CampaignStatus): number {
  return statusCounts.find((item) => item.status === status)?.count ?? 0;
}

export function BrandOverviewScreen() {
  const { t } = useTranslation();
  const initial = useAccountInitial();
  const recent = [...brandCampaigns].sort(byRecentUpdate).slice(0, 3);
  const showComingSoon = () =>
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonBody'));
  // Chuỗi rỗng xoá bộ lọc đang giữ trên tab Chiến dịch
  const openCampaigns = (status?: CampaignStatus) =>
    router.push({
      pathname: '/brand/campaigns',
      params: { status: status ? String(status) : '' },
    });

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <AppHeader
          initial={initial}
          avatarLabel={t('tabs.account')}
          onAvatarPress={() => router.push('/brand/account')}
          notificationsLabel={t('redsun.notifications')}
          onNotificationsPress={showComingSoon}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <StatsHero
          eyebrow={t('brand.overview.eyebrow')}
          title={t('brand.overview.title')}
          subtitle={t('brand.overview.subtitle')}
          metrics={[
            {
              value: String(countOf(CAMPAIGN_STATUS.APPROVED)),
              label: t('brand.overview.running'),
            },
            {
              value: String(countOf(CAMPAIGN_STATUS.PENDING_APPROVAL)),
              label: t('brand.overview.pending'),
            },
            {
              value: String(activeCollaborationCount),
              label: t('brand.overview.collaborating'),
            },
          ]}
        />
        <BrandButton
          title={t('brand.createCampaign')}
          onPress={showComingSoon}
        />
        <View style={styles.section}>
          <SectionHeader title={t('brand.overview.attention')} />
          {ATTENTION_STATUSES.map((status) => (
            <Pressable
              key={status}
              accessibilityRole="button"
              onPress={() => openCampaigns(status)}
              style={({ pressed }) => [
                styles.attention,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <StatusBadge
                label={t(`brand.status.${STATUS_KEY[status]}`)}
                tone={STATUS_TONE[status]}
              />
              <Text style={styles.attentionHint} numberOfLines={1}>
                {t(`brand.overview.hint.${STATUS_KEY[status]}`)}
              </Text>
              <Text style={styles.attentionCount}>{countOf(status)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.section}>
          <SectionHeader
            title={t('brand.overview.recent')}
            actionLabel={t('redsun.viewAll')}
            onAction={() => openCampaigns()}
          />
          {recent.map((campaign) => (
            <BrandCampaignRow
              key={campaign.id}
              campaign={campaign}
              onPress={showComingSoon}
            />
          ))}
        </View>
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
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  content: {
    flexGrow: 1,
    backgroundColor: brand.canvas,
    padding: 18,
    gap: 18,
  },
  section: { gap: 10 },
  attention: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: brand.paper,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.border,
  },
  attentionHint: { flex: 1, fontSize: 12.5, color: brand.muted },
  attentionCount: { fontSize: 16, fontWeight: '600', color: brand.ink },
});
