import colors from '@/constants/colors';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * The active palette follows the saved light/dark choice in ThemeContext.
 */
export function useColors() {
  const { isDark } = useAppTheme();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
