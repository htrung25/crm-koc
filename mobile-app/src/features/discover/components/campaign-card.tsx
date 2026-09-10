import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { brand } from '@/shared/theme';
import { Artwork, Text } from '@/shared/ui';
import type { Campaign } from '../model/fixtures';

export function CampaignCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const { t } = useTranslation();
  const open = campaign.status === 'open';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Artwork label={t('redsun.productImage')} tone={campaign.tone} style={{ height: 112 }} />
      <View style={styles.body}>
        <Text style={styles.title}>{t(campaign.titleKey)}</Text>
        <Text style={styles.meta}>{campaign.brand}</Text>
        <View style={styles.row}>
          <Text style={styles.commission}>
            {t('redsun.commission', { value: campaign.commission })}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: open ? brand.successSoft : brand.warningSoft },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: open ? brand.success : brand.warning,
              }}
            >
              {t(`redsun.${campaign.status}`)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    width: 224,
    borderRadius: 16,
    backgroundColor: brand.paper,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  body: { padding: 13, gap: 5 },
  title: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: brand.ink },
  meta: { fontSize: 11.5, color: brand.muted },
  row: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  commission: { fontSize: 12, fontWeight: '600', color: brand.strong },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7 },
});
