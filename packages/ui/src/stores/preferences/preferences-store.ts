import { createStore } from 'zustand/vanilla';

import { applyPreference } from '../../theme/preference-runtime';
import {
  PREFERENCE_DEFAULTS,
  PREFERENCE_KEYS,
  type PreferenceKey,
  type PreferenceValueMap,
} from '../../theme/preferences-config';
import { persistPreference } from '../../theme/preferences-storage';
import type { ResolvedThemeMode } from '../../theme/theme';

export type PreferencesState = {
  values: PreferenceValueMap;
  resolvedThemeMode: ResolvedThemeMode;
  isSynced: boolean;
  setPreference: <K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]) => void;
  resetPreferences: () => void;
};

export const createPreferencesStore = (initialValues: Partial<PreferenceValueMap> = {}) => {
  const values: PreferenceValueMap = { ...PREFERENCE_DEFAULTS, ...initialValues };

  return createStore<PreferencesState>()((set) => ({
    values,
    resolvedThemeMode: values.theme_mode === 'dark' ? 'dark' : 'light',
    isSynced: false,

    setPreference: (key, value) => {
      const resolvedThemeMode = applyPreference(key, value);
      set((state) => ({
        values: { ...state.values, [key]: value } as PreferenceValueMap,
        ...(resolvedThemeMode ? { resolvedThemeMode } : {}),
      }));
      persistPreference(key, value);
    },

    resetPreferences: () => {
      let resolvedThemeMode: ResolvedThemeMode = 'light';
      for (const key of PREFERENCE_KEYS) {
        const value = PREFERENCE_DEFAULTS[key];
        const resolved = applyPreference(key, value);
        if (resolved) resolvedThemeMode = resolved;
        persistPreference(key, value);
      }
      set({ values: { ...PREFERENCE_DEFAULTS }, resolvedThemeMode });
    },
  }));
};
