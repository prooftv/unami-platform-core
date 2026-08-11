'use client';

import { useShallow } from 'zustand/react/shallow';
import { usePreferencesStore, THEME_PRESET_OPTIONS, fontOptions } from '@unami/ui';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PreferenceValueMap } from '@unami/ui';

function ToggleRow({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onValueChange(v); }}
      spacing={0}
      className="w-full rounded-md border border-input bg-background"
    >
      {options.map((opt) => (
        <ToggleGroupItem key={opt.value} value={opt.value} variant="outline" size="sm" className="flex-1 text-xs">
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function AppearanceForm() {
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
    <div className="space-y-6">
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
                className={`flex flex-col items-center gap-1.5 rounded-md border-2 p-2 text-[10px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${isActive ? 'border-primary' : 'border-transparent'}`}
              >
                <span className="h-5 w-5 rounded-full ring-1 ring-border" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground leading-none">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="pref-font">Font</Label>
        <Select value={values.font} onValueChange={set('font')}>
          <SelectTrigger id="pref-font" className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((f) => (
              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Mode</Label>
        <ToggleRow
          value={values.theme_mode}
          onValueChange={set('theme_mode')}
          options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Page Layout</Label>
        <ToggleRow
          value={values.content_layout}
          onValueChange={set('content_layout')}
          options={[{ value: 'centered', label: 'Centered' }, { value: 'full-width', label: 'Full Width' }]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Navbar</Label>
        <ToggleRow
          value={values.navbar_style}
          onValueChange={set('navbar_style')}
          options={[{ value: 'sticky', label: 'Sticky' }, { value: 'scroll', label: 'Scroll' }]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Sidebar Style</Label>
        <ToggleRow
          value={values.sidebar_variant}
          onValueChange={set('sidebar_variant')}
          options={[{ value: 'inset', label: 'Inset' }, { value: 'sidebar', label: 'Sidebar' }, { value: 'floating', label: 'Floating' }]}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Sidebar Collapse</Label>
        <ToggleRow
          value={values.sidebar_collapsible}
          onValueChange={set('sidebar_collapsible')}
          options={[{ value: 'icon', label: 'Icon' }, { value: 'offcanvas', label: 'OffCanvas' }]}
        />
      </div>

      <Separator />

      <Button variant="outline" size="sm" onClick={resetPreferences}>
        Restore Defaults
      </Button>
    </div>
  );
}
