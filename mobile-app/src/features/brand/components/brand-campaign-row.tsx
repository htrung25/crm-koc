import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { brand } from '@/shared/theme';
import { StatusBadge, Text } from '@/shared/ui';

import {
  formatShortDate,
  STATUS_KEY,
  STATUS_TONE,
} from '@/features/brand/model/campaign';
import {
  CAMPAIGN_STATUS,
  type BrandCampaign,
} from '@/features/brand/model/types';

export function BrandCampaignRow({
  campaign,
  onPress,
}: {
  campaign: BrandCampaign;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();

  let meta: string;
  if (campaign.status === CAMPAIGN_STATUS.DRAFT && campaign.wizardStep) {
    meta = t('brand.campaigns.step', { step: campaign.wizardStep });
  } else if (campaign.applicationDeadline) {
    meta = t('brand.campaigns.deadline', {
      date: formatShortDate(campaign.applicationDeadline, i18n.language),
    });
  } else {
    meta = t('brand.campaigns.updated', {
      date: formatShortDate(campaign.updatedAt, i18n.language),
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.main}>
        <Text style={styles.code}>{campaign.code}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {campaign.title ?? t('brand.campaigns.untitled')}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <StatusBadge
        label={t(`brand.status.${STATUS_KEY[campaign.status]}`)}
        tone={STATUS_TONE[campaign.status]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    backgroundColor: brand.paper,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.border,
  },
  main: { flex: 1, gap: 2 },
  code: { fontSize: 10.5, letterSpacing: 1, color: brand.muted },
  title: { fontSize: 14, fontWeight: '600', color: brand.ink },
  meta: { fontSize: 11.5, color: brand.muted },
});
