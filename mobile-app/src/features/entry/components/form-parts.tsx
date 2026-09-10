import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { brand } from '@/shared/theme';
import { BrandButton, PageHeader, Text, TextAction } from '@/shared/ui';

export function EntryShell({
  title,
  step,
  children,
}: {
  title: string;
  step?: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <PageHeader
        title={title}
        trailing={step}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function EntryHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
export function EntryField({
  label,
  error,
  password,
  ...props
}: TextInputProps & { label: string; error?: string; password?: boolean }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          { borderColor: error ? brand.primary : focused ? brand.primary : brand.border },
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={password && !visible}
          placeholderTextColor={brand.muted}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {password ? (
          <TextAction
            label={`${t(visible ? 'redsun.hide' : 'redsun.show')} ${label}`}
            onPress={() => setVisible((v) => !v)}
          >
            {t(visible ? 'redsun.hide' : 'redsun.show')}
          </TextAction>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t(error)}
        </Text>
      ) : null}
    </View>
  );
}
export function Checkbox({
  checked,
  onPress,
  label,
  error,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onPress}
        style={styles.checkboxRow}
      >
        <View style={[styles.checkbox, { backgroundColor: checked ? brand.primary : brand.paper }]}>
          <Text style={{ color: brand.paper, fontSize: 12 }}>{checked ? '✓' : ''}</Text>
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t(error)}
        </Text>
      ) : null}
    </View>
  );
}
export function SocialButtons({ register = false }: { register?: boolean }) {
  const { t } = useTranslation();
  const inform = () => Alert.alert(t('redsun.socialTitle'), t('redsun.socialBody'));
  return (
    <View style={{ gap: 9 }}>
      <BrandButton
        title={`G   ${t(register ? 'redsun.googleRegister' : 'redsun.googleLogin')}`}
        secondary
        onPress={inform}
      />
      {register ? (
        <BrandButton title={`♪   ${t('redsun.tiktokRegister')}`} secondary onPress={inform} />
      ) : null}
    </View>
  );
}
export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.paper },
  content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 40, gap: 18 },
  title: { color: brand.ink, fontSize: 25, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4 },
  subtitle: { color: brand.muted, fontSize: 13.5, lineHeight: 22 },
  label: { color: brand.muted, fontSize: 12, fontWeight: '500' },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  input: { flex: 1, minWidth: 0, color: brand.ink, fontSize: 15, paddingVertical: 14 },
  error: { color: brand.strong, fontSize: 12, lineHeight: 18 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 44 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1, color: brand.muted, fontSize: 12.5, lineHeight: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: brand.border },
  dividerText: { fontSize: 10, letterSpacing: 1, color: brand.muted },
});
