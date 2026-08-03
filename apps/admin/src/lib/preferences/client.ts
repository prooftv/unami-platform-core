'use client';

import {
  usePreferencesStore,
  applyThemeMode,
  applyThemePreset,
  applyContentLayout,
  applySidebarCollapsible,
} from '@unami/ui';
import type { PreferencesState } from '@unami/ui';

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useThemeMode(): [PreferencesState['themeMode'], (m: PreferencesState['themeMode']) => void] {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  function set(mode: PreferencesState['themeMode']) {
    setThemeMode(mode);
    applyThemeMode(mode);
    setCookie('theme_mode', mode);
  }

  return [themeMode, set];
}

export function useThemePreset(): [PreferencesState['themePreset'], (p: PreferencesState['themePreset']) => void] {
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);

  function set(preset: PreferencesState['themePreset']) {
    setThemePreset(preset);
    applyThemePreset(preset);
    setCookie('theme_preset', preset);
  }

  return [themePreset, set];
}

export function useSidebarCollapsible(): [boolean, (collapsed: boolean) => void] {
  const sidebarCollapsible = usePreferencesStore((s) => s.sidebarCollapsible);
  const setSidebarCollapsible = usePreferencesStore((s) => s.setSidebarCollapsible);
  const collapsed = sidebarCollapsible === 'offcanvas';

  function set(isCollapsed: boolean) {
    const value: PreferencesState['sidebarCollapsible'] = isCollapsed ? 'offcanvas' : 'icon';
    setSidebarCollapsible(value);
    applySidebarCollapsible(value);
    setCookie('sidebar_collapsible', value);
  }

  return [collapsed, set];
}

export function useContentLayout(): [PreferencesState['contentLayout'], (l: PreferencesState['contentLayout']) => void] {
  const contentLayout = usePreferencesStore((s) => s.contentLayout);
  const setContentLayoutValue = usePreferencesStore((s) => s.setContentLayoutValue);

  function set(layout: PreferencesState['contentLayout']) {
    setContentLayoutValue(layout);
    applyContentLayout(layout);
    setCookie('content_layout', layout);
  }

  return [contentLayout, set];
}
