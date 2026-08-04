import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from './theme';
import { CONTENT_LAYOUT_VALUES, NAVBAR_STYLE_VALUES, SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from './layout';

export const PREFERENCE_REGISTRY = {
  theme_mode: {
    values: THEME_MODE_VALUES,
    defaultValue: 'light' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-theme-mode' as const,
  },
  theme_preset: {
    values: THEME_PRESET_VALUES,
    defaultValue: 'default' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-theme-preset' as const,
  },
  font: {
    values: ['geist', 'inter', 'notoSans', 'nunitoSans', 'figtree', 'roboto', 'raleway', 'dmSans', 'publicSans', 'outfit'] as const,
    defaultValue: 'geist' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-font' as const,
  },
  content_layout: {
    values: CONTENT_LAYOUT_VALUES,
    defaultValue: 'centered' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-content-layout' as const,
  },
  navbar_style: {
    values: NAVBAR_STYLE_VALUES,
    defaultValue: 'sticky' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-navbar-style' as const,
  },
  sidebar_variant: {
    values: SIDEBAR_VARIANT_VALUES,
    defaultValue: 'sidebar' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-sidebar-variant' as const,
  },
  sidebar_collapsible: {
    values: SIDEBAR_COLLAPSIBLE_VALUES,
    defaultValue: 'icon' as const,
    persistence: 'client-cookie' as const,
    attribute: 'data-sidebar-collapsible' as const,
  },
} as const;

export type PreferenceKey = keyof typeof PREFERENCE_REGISTRY;
export type PreferenceValueMap = {
  [K in PreferenceKey]: (typeof PREFERENCE_REGISTRY)[K]['values'][number];
};

export const PREFERENCE_DEFAULTS = Object.fromEntries(
  (Object.keys(PREFERENCE_REGISTRY) as PreferenceKey[]).map((key) => [key, PREFERENCE_REGISTRY[key].defaultValue]),
) as PreferenceValueMap;
