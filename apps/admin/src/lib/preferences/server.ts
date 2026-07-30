import { cookies } from 'next/headers';
import {
  PREFERENCE_DEFAULTS,
  THEME_MODE_VALUES,
  THEME_PRESET_VALUES,
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
} from '@moments/ui';
import type { PreferencesState } from '@moments/ui';

function safe<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export async function getServerPreferences(): Promise<{
  themeMode: PreferencesState['themeMode'];
  themePreset: PreferencesState['themePreset'];
  font: PreferencesState['font'];
  contentLayout: PreferencesState['contentLayout'];
  navbarStyle: PreferencesState['navbarStyle'];
  sidebarCollapsible: PreferencesState['sidebarCollapsible'];
}> {
  const jar = await cookies();
  const get = (key: string) => jar.get(key)?.value;

  return {
    themeMode:
      safe(get('theme_mode'), THEME_MODE_VALUES) ?? PREFERENCE_DEFAULTS.theme_mode,
    themePreset:
      safe(get('theme_preset'), THEME_PRESET_VALUES) ?? PREFERENCE_DEFAULTS.theme_preset,
    font:
      (get('font') as PreferencesState['font']) ?? PREFERENCE_DEFAULTS.font,
    contentLayout:
      safe(get('content_layout'), CONTENT_LAYOUT_VALUES) ?? PREFERENCE_DEFAULTS.content_layout,
    navbarStyle:
      safe(get('navbar_style'), NAVBAR_STYLE_VALUES) ?? PREFERENCE_DEFAULTS.navbar_style,
    sidebarCollapsible:
      safe(get('sidebar_collapsible'), SIDEBAR_COLLAPSIBLE_VALUES) ?? PREFERENCE_DEFAULTS.sidebar_collapsible,
  };
}
