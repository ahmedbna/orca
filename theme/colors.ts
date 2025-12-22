import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const lightColors = {
  orca: '#FAD40B',

  // Base colors
  background: '#000000',
  foreground: '#FFFFFF',

  // Card colors
  card: '#1C1C1E',
  cardForeground: '#FFFFFF',

  // Popover colors
  popover: '#18181b',
  popoverForeground: '#FFFFFF',

  // Primary colors
  primary: '#e4e4e7',
  primaryForeground: '#18181b',

  // Secondary colors
  secondary: '#1C1C1E',
  secondaryForeground: '#FFFFFF',

  // Muted colors
  muted: '#78788033',
  mutedForeground: '#a1a1aa',

  // Accent colors
  accent: '#1C1C1E',
  accentForeground: '#FFFFFF',

  // Destructive colors
  destructive: '#dc2626',
  destructiveForeground: '#FFFFFF',

  // Border and input - using alpha values for better blending
  border: '#38383A',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#71717a',

  // Text colors
  text: '#FFFFFF',
  textMuted: '#a1a1aa',

  // Legacy support for existing components
  tint: '#FFFFFF',
  icon: '#a1a1aa',
  tabIconDefault: '#a1a1aa',
  tabIconSelected: '#FFFFFF',

  // Default buttons, links, Send button, selected tabs
  blue: '#0A84FF',

  // Success states, FaceTime buttons, completed tasks
  green: '#30D158',

  // Delete buttons, error states, critical alerts
  red: '#FF453A',

  // VoiceOver highlights, warning states
  orange: '#FF9F0A',

  // Notes app accent, Reminders highlights
  yellow: '#FFD60A',

  // Pink accent color for various UI elements
  pink: '#FF375F',

  // Purple accent for creative apps and features
  purple: '#BF5AF2',

  // Teal accent for communication features
  teal: '#64D2FF',

  // Indigo accent for system features
  indigo: '#5E5CE6',
};

export const darkColors = {
  orca: '#FAD40B',

  // Base colors
  background: '#000000',
  foreground: '#FFFFFF',

  // Card colors
  card: '#1C1C1E',
  cardForeground: '#FFFFFF',

  // Popover colors
  popover: '#18181b',
  popoverForeground: '#FFFFFF',

  // Primary colors
  primary: '#e4e4e7',
  primaryForeground: '#18181b',

  // Secondary colors
  secondary: '#1C1C1E',
  secondaryForeground: '#FFFFFF',

  // Muted colors
  muted: '#78788033',
  mutedForeground: '#a1a1aa',

  // Accent colors
  accent: '#1C1C1E',
  accentForeground: '#FFFFFF',

  // Destructive colors
  destructive: '#dc2626',
  destructiveForeground: '#FFFFFF',

  // Border and input - using alpha values for better blending
  border: '#38383A',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#71717a',

  // Text colors
  text: '#FFFFFF',
  textMuted: '#a1a1aa',

  // Legacy support for existing components
  tint: '#FFFFFF',
  icon: '#a1a1aa',
  tabIconDefault: '#a1a1aa',
  tabIconSelected: '#FFFFFF',

  // Default buttons, links, Send button, selected tabs
  blue: '#0A84FF',

  // Success states, FaceTime buttons, completed tasks
  green: '#30D158',

  // Delete buttons, error states, critical alerts
  red: '#FF453A',

  // VoiceOver highlights, warning states
  orange: '#FF9F0A',

  // Notes app accent, Reminders highlights
  yellow: '#FFD60A',

  // Pink accent color for various UI elements
  pink: '#FF375F',

  // Purple accent for creative apps and features
  purple: '#BF5AF2',

  // Teal accent for communication features
  teal: '#64D2FF',

  // Indigo accent for system features
  indigo: '#5E5CE6',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};
