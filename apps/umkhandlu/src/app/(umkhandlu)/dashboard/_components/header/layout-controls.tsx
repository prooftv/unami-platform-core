'use client';

import { Settings } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fontOptions, type FontKey } from '@/lib/fonts/registry';
import type { ContentLayout, SidebarCollapsible, SidebarVariant } from '@/lib/preferences/layout';
import { THEME_PRESET_OPTIONS, type ThemeMode, type ThemePreset } from '@/lib/preferences/theme';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

export function LayoutControls() {
  const { values, resolvedThemeMode, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      resolvedThemeMode: state.resolvedThemeMode,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  const { theme_mode, theme_preset, content_layout, sidebar_variant, sidebar_collapsible, font } = values;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Preferences</h4>
            <p className="text-muted-foreground text-xs">Customize your dashboard appearance.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Theme Preset</Label>
              <Select value={theme_preset} onValueChange={(v) => setPreference('theme_preset', v as ThemePreset)}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEME_PRESET_OPTIONS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value} className="text-xs">
                        <span
                          className="size-2.5 rounded-full inline-block mr-1"
                          style={{ backgroundColor: resolvedThemeMode === 'dark' ? preset.primary.dark : preset.primary.light }}
                        />
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Font</Label>
              <Select value={font} onValueChange={(v) => setPreference('font', v as FontKey)}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {fontOptions.map((f) => (
                      <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Theme Mode</Label>
              <ToggleGroup size="sm" variant="outline" type="single" value={theme_mode}
                onValueChange={(v) => v && setPreference('theme_mode', v as ThemeMode)}
                className="w-full *:flex-1">
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                <ToggleGroupItem value="system">System</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Page Layout</Label>
              <ToggleGroup size="sm" variant="outline" type="single" value={content_layout}
                onValueChange={(v) => v && setPreference('content_layout', v as ContentLayout)}
                className="w-full *:flex-1">
                <ToggleGroupItem value="centered">Centered</ToggleGroupItem>
                <ToggleGroupItem value="full-width">Full Width</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Sidebar Style</Label>
              <ToggleGroup size="sm" variant="outline" type="single" value={sidebar_variant}
                onValueChange={(v) => v && setPreference('sidebar_variant', v as SidebarVariant)}
                className="w-full *:flex-1">
                <ToggleGroupItem value="sidebar">Sidebar</ToggleGroupItem>
                <ToggleGroupItem value="inset">Inset</ToggleGroupItem>
                <ToggleGroupItem value="floating">Float</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Sidebar Collapse</Label>
              <ToggleGroup size="sm" variant="outline" type="single" value={sidebar_collapsible}
                onValueChange={(v) => v && setPreference('sidebar_collapsible', v as SidebarCollapsible)}
                className="w-full *:flex-1">
                <ToggleGroupItem value="icon">Icon</ToggleGroupItem>
                <ToggleGroupItem value="offcanvas">Offcanvas</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button type="button" size="sm" variant="outline" className="w-full text-xs" onClick={resetPreferences}>
              Restore Defaults
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
