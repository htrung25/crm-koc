import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand } from '@/shared/theme';
import { Choice, SearchField, Text } from '@/shared/ui';

import { creatorCategories, creators } from '@/features/brand/model/fixtures';

export function BrandCreatorsScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const query = search.trim().toLocaleLowerCase();
  const visible = creators.filter(
    (creator) =>
      (category === null || creator.category === category) &&
      `${creator.name} ${creator.platform}`.toLocaleLowerCase().includes(query)
  );
  const showComingSoon = () =>
    Alert.alert(t('common.comingSoonTitle'), t('common.comingSoonBody'));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.creators')}</Text>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t('brand.creators.search')}
          clearLabel={t('redsun.clear')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Choice
            label={t('brand.creators.allCategories')}
            selected={category === null}
            onPress={() => setCategory(null)}
          />
          {creatorCategories.map((name) => (
            <Choice
              key={name}
              label={name}
              selected={category === name}
              onPress={() => setCategory(name)}
            />
          ))}
        </ScrollView>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {visible.length > 0 ? (
          visible.map((creator) => (
            <Pressable
              key={creator.id}
              accessibilityRole="button"
              onPress={showComingSoon}
              style={({ pressed }) => [
                styles.creator,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: brand[creator.color] },
                ]}
              >
                <Text style={styles.avatarText}>{creator.name.charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{creator.name}</Text>
                <Text style={styles.meta}>
                  {t('brand.creators.reach', {
                    platform: creator.platform,
                    followers: creator.followers,
                  })}
                </Text>
              </View>
              <Text style={styles.category}>{creator.category}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>{t('brand.creators.empty')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: brand.border,
  },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', color: brand.ink },
  chips: { gap: 7 },
  list: {
    flexGrow: 1,
    backgroundColor: brand.canvas,
    padding: 18,
    gap: 10,
  },
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
  info: { flex: 1, gap: 2 },
  name: { color: brand.ink, fontSize: 13, fontWeight: '600' },
  meta: { color: brand.muted, fontSize: 11.5 },
  category: { color: brand.strong, fontSize: 11 },
  empty: {
    color: brand.muted,
    paddingVertical: 18,
    fontSize: 13,
    textAlign: 'center',
  },
});
