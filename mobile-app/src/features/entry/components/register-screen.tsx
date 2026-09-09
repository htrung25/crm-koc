import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, View, type TextInputProps } from 'react-native';
import { BrandButton, Choice, TextAction } from '@/shared/ui';
import { registerSchema, type RegisterValues } from '../model/schemas';
import {
  Checkbox,
  Divider,
  EntryField,
  EntryHeading,
  EntryShell,
  SocialButtons,
} from './form-parts';

const fields: {
  name: 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';
  placeholder: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  password?: boolean;
}[] = [
  { name: 'name', placeholder: 'Nguyễn An Nhiên', autoComplete: 'name' },
  {
    name: 'email',
    placeholder: 'ban@thuonghieu.vn',
    keyboardType: 'email-address',
    autoComplete: 'email',
  },
  { name: 'phone', placeholder: '0912 345 678', keyboardType: 'phone-pad', autoComplete: 'tel' },
  { name: 'password', placeholder: '', password: true, autoComplete: 'new-password' },
  { name: 'confirmPassword', placeholder: '', password: true, autoComplete: 'new-password' },
];
export function RegisterScreen() {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'koc',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });
  const submit = handleSubmit(() =>
    router.replace({ pathname: '/complete', params: { kind: 'register' } }),
  );
  return (
    <EntryShell title={t('redsun.createAccount')} step="01 / 02">
      <EntryHeading title={t('redsun.join')} subtitle={t('redsun.joinSubtitle')} />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Choice
                label={t('redsun.koc')}
                selected={field.value === 'koc'}
                onPress={() => field.onChange('koc')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Choice
                label={t('redsun.brandRole')}
                selected={field.value === 'brand'}
                onPress={() => field.onChange('brand')}
              />
            </View>
          </View>
        )}
      />
      <SocialButtons register />
      <Divider label={t('redsun.orDetails')} />
      <View style={{ gap: 14 }}>
        {fields.map((config) => (
          <Controller
            key={config.name}
            control={control}
            name={config.name}
            render={({ field, fieldState }) => (
              <EntryField
                label={t(`redsun.${config.name}`)}
                placeholder={
                  config.password ? t(`redsun.${config.name}Placeholder`) : config.placeholder
                }
                password={config.password}
                keyboardType={config.keyboardType}
                autoComplete={config.autoComplete}
                autoCapitalize={config.name === 'name' ? 'words' : 'none'}
                autoCorrect={false}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </View>
      <Controller
        control={control}
        name="terms"
        render={({ field, fieldState }) => (
          <Checkbox
            label={t('redsun.terms')}
            checked={field.value}
            onPress={() => field.onChange(!field.value)}
            error={fieldState.error?.message}
          />
        )}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {['termsLink', 'privacyLink'].map((key) => (
          <TextAction
            key={key}
            onPress={() => Alert.alert(t(`redsun.${key}`), t('redsun.policyBody'))}
          >
            {t(`redsun.${key}`)}
          </TextAction>
        ))}
      </View>
      <BrandButton title={t('redsun.registerNow')} onPress={submit} />
      <View style={{ alignItems: 'center' }}>
        <TextAction onPress={() => router.replace('/sign-in')}>
          {t('redsun.haveAccount')}
        </TextAction>
      </View>
    </EntryShell>
  );
}
