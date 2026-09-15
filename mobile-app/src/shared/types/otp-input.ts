import type { TextInputProps } from 'react-native';

export type OtpInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType' | 'maxLength' | 'placeholder'
> & {
  value: string;
  onChangeText: (value: string) => void;
  length: number;
  label?: string;
  error?: string;
};
