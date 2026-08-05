'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { usePreferencesStore } from '../providers/preferences-provider';

const CYCLE = ['light', 'dark', 'system'] as const;

export function ShellThemeSwitcher() {
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((s) => ({ themeMode: s.values.theme_mode, setPreference: s.setPreference })),
  );

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(themeMode) + 1) % CYCLE.length];
    setPreference('theme_mode', next);
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Current theme: ${themeMode}. Click to cycle`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Monitor className="hidden [html[data-theme-mode=system]_&]:block h-4 w-4" />
      <Sun className="hidden dark:block [html[data-theme-mode=system]_&]:hidden h-4 w-4" />
      <Moon className="block dark:hidden [html[data-theme-mode=system]_&]:hidden h-4 w-4" />
    </button>
  );
}
