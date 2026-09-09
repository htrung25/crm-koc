import { useColorScheme } from 'react-native';

import { darkColors, lightColors, radius, spacing, typography, type Colors } from './tokens';

export type Theme = {
  isDark: boolean;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
