import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Button, Input } from '@/shared/ui';

import { useResendOtp, useVerifyOtp } from '../hooks/use-auth';
import { verifyOtpSchema, type VerifyOtpInput } from '../model/schemas';

import { FormError } from './form-error';

export function OtpForm({ email }: { email: string }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const { control, handleSubmit, formState } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, otp: '' },
  });

  const submit = handleSubmit((values) => verifyOtp.mutate(values));

  return (
    <View style={{ gap: spacing.md }}>
      <Controller
        control={control}
        name="otp"
        render={({ field }) => (
          <Input
            label={t('auth.otp.code')}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.otp && t(formState.errors.otp.message ?? '')}
          />
        )}
      />
      <FormError error={verifyOtp.error ?? resendOtp.error} />
      <Button title={t('auth.otp.submit')} loading={verifyOtp.isPending} onPress={submit} />
      <Button
        title={t('auth.otp.resend')}
        variant="ghost"
        loading={resendOtp.isPending}
        onPress={() => resendOtp.mutate(email)}
      />
    </View>
  );
}
