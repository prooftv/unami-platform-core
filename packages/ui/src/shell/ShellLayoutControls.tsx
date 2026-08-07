'use client';

import { Popover, ToggleGroup } from 'radix-ui';
import { Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useShallow } from 'zustand/react/shallow';

import { fontOptions } from '../fonts/registry';
import { THEME_PRESET_OPTIONS } from '../theme/theme';
import { usePreferencesStore } from '../providers/preferences-provider';
import { Button } from '../primitives/Button';
import { Label } from '../primitives/Label';
import { SelectRoot, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../primitives/Select';
import type { PreferenceValueMap } from '../theme/preferences-config';

function ToggleRow({ value, onValueChange, options }: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onValueChange(v); }}
      className="flex w-full rounded-md border border-input bg-background p-0.5 gap-0.5"
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          className="flex-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {opt.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

export function ShellLayoutControls() {
  const { values, resolvedThemeMode, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((s) => ({
      values: s.values,
      resolvedThemeMode: s.resolvedThemeMode,
      setPreference: s.setPreference,
      resetPreferences: s.resetPreferences,
    })),
  );

  function set<K extends keyof PreferenceValueMap>(key: K) {
    return (value: string) => { if (value) setPreference(key, value as PreferenceValueMap[K]); };
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Layout preferences">
          <Settings className="h-4 w-4" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm">Preferences</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Customize your dashboard appearance.</p>
            </div>

            {/* Theme Preset — swatch grid */}
            <div className="space-y-2">
              <Label className="text-xs">Theme Preset</Label>
              <div className="grid grid-cols-4 gap-2">
                {THEME_PRESET_OPTIONS.map((preset) => {
                  const color = resolvedThemeMode === 'dark' ? preset.primary.dark : preset.primary.light;
                  const isActive = values.theme_preset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPreference('theme_preset', preset.value)}
                      title={preset.label}
                      className={clsx(
                        'flex flex-col items-center gap-1.5 rounded-md border-2 p-2 text-[10px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        isActive ? 'border-primary' : 'border-transparent',
                      )}
                    >
                      <span
                        className="h-5 w-5 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-muted-foreground leading-none">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font */}
            <div className="space-y-2">
              <Label className="text-xs" htmlFor="pref-font">Font</Label>
              <SelectRoot value={values.font} onValueChange={set('font')}>
                <SelectTrigger id="pref-font" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            {/* Theme Mode */}
            <div className="space-y-2">
              <Label className="text-xs">Mode</Label>
              <ToggleRow
                value={values.theme_mode}
                onValueChange={set('theme_mode')}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
              />
            </div>

            {/* Page Layout */}
            <div className="space-y-2">
              <Label className="text-xs">Page Layout</Label>
              <ToggleRow
                value={values.content_layout}
                onValueChange={set('content_layout')}
                options={[{ value: 'centered', label: 'Centered' }, { value: 'full-width', label: 'Full Width' }]}
              />
            </div>

            {/* Navbar */}
            <div className="space-y-2">
              <Label className="text-xs">Navbar</Label>
              <ToggleRow
                value={values.navbar_style}
                onValueChange={set('navbar_style')}
                options={[{ value: 'sticky', label: 'Sticky' }, { value: 'scroll', label: 'Scroll' }]}
              />
            </div>

            {/* Sidebar Style */}
            <div className="space-y-2">
              <Label className="text-xs">Sidebar Style</Label>
              <ToggleRow
                value={values.sidebar_variant}
                onValueChange={set('sidebar_variant')}
                options={[{ value: 'inset', label: 'Inset' }, { value: 'sidebar', label: 'Sidebar' }, { value: 'floating', label: 'Floating' }]}
              />
            </div>

            {/* Sidebar Collapse */}
            <div className="space-y-2">
              <Label className="text-xs">Sidebar Collapse</Label>
              <ToggleRow
                value={values.sidebar_collapsible}
                onValueChange={set('sidebar_collapsible')}
                options={[{ value: 'icon', label: 'Icon' }, { value: 'offcanvas', label: 'OffCanvas' }]}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={resetPreferences}
            >
              Restore Defaults
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
