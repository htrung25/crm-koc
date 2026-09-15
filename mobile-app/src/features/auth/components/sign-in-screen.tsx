import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { FormError } from '@/features/auth/components/form-error';
import { useLogin } from '@/features/auth/hooks/use-auth';
import { BrandButton, TextAction } from '@/shared/ui';
import {
  signInSchema,
  type SignInValues,
} from '@/features/auth/model/form-schemas';
import {
  Divider,
  EntryField,
  EntryHeading,
  EntryShell,
  SocialButtons,
} from '@/features/auth/components/form-parts';

export function SignInScreen() {
  const { t } = useTranslation();
  const login = useLogin();
  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit((values) => {
    // Mỗi lần gửi là một email OTP; phím "done" vẫn gọi được khi nút đã khoá.
    if (login.isPending) return;
    login.mutate(values, {
      onSuccess: () =>
        router.push({
          pathname: '/verify-otp',
          params: { email: values.email },
        }),
    });
  });
  return (
    <EntryShell title={t('redsun.login')}>
      <EntryHeading
        title={t('redsun.welcomeBack')}
        subtitle={t('redsun.loginSubtitle')}
      />
      <SocialButtons />
      <Divider label={t('redsun.orEmail')} />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <EntryField
            label={t('redsun.email')}
            placeholder="ban@thuonghieu.vn"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <View style={{ gap: 2 }}>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <EntryField
              label={t('redsun.password')}
              placeholder="••••••••"
              password
              autoCapitalize="none"
              autoComplete="current-password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              onSubmitEditing={submit}
              returnKeyType="done"
            />
          )}
        />
        <View style={{ alignItems: 'flex-end' }}>
          <TextAction
            onPress={() =>
              Alert.alert(t('redsun.forgot'), t('redsun.forgotBody'))
            }
          >
            {t('redsun.forgot')}
          </TextAction>
        </View>
      </View>
      <FormError error={login.error} />
      <BrandButton
        title={t('redsun.loginNow')}
        dark
        disabled={login.isPending}
        onPress={submit}
      />
      <View style={{ alignItems: 'center' }}>
        <TextAction onPress={() => router.replace('/register')}>
          {t('redsun.noAccount')}
        </TextAction>
      </View>
    </EntryShell>
  );
}
