import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Button, Input } from '@/shared/ui';

import { useLogin } from '../hooks/use-auth';
import { loginSchema, type LoginInput } from '../model/schemas';

import { FormError } from './form-error';

export function LoginForm({ onOtpRequired }: { onOtpRequired: (email: string) => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const login = useLogin();

  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => onOtpRequired(values.email) });
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label={t('auth.login.email')}
            placeholder={t('auth.login.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email && t(formState.errors.email.message ?? '')}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label={t('auth.login.password')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={submit}
            error={formState.errors.password && t(formState.errors.password.message ?? '')}
          />
        )}
      />
      <FormError error={login.error} />
      <Button title={t('auth.login.submit')} loading={login.isPending} onPress={submit} />
    </View>
  );
}
