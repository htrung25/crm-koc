import { StyleSheet, TextInput, View } from 'react-native';

import { brand } from '@/shared/theme';
import type { SearchFieldProps } from '@/shared/types';

import { TextAction } from '@/shared/ui/brand-ui';
import { Text } from '@/shared/ui/text';

export function SearchField({
  value,
  onChangeText,
  placeholder,
  clearLabel,
}: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={brand.muted}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <TextAction label={clearLabel} onPress={() => onChangeText('')}>
          ×
        </TextAction>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
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
  icon: { color: brand.muted, fontSize: 24 },
  input: {
    flex: 1,
    minWidth: 0,
    color: brand.ink,
    fontSize: 13,
    paddingVertical: 12,
  },
});
