'use client';

import { Popover, Select, ToggleGroup } from 'radix-ui';
const PopoverPrimitive = Popover;
const SelectPrimitive = Select;
const ToggleGroupPrimitive = ToggleGroup;
import { ChevronDown, Check, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useShallow } from 'zustand/react/shallow';

import { fontOptions } from '../fonts/registry';
import { THEME_PRESET_OPTIONS } from '../theme/theme';
import { usePreferencesStore } from '../providers/preferences-provider';
import type { PreferenceValueMap } from '../theme/preferences-config';

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={clsx('text-xs font-medium', className)}>{children}</label>;
}

function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SimpleSelect({ value, onValueChange, options }: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string; swatch?: string }[];
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon><ChevronDown className="h-3 w-3 opacity-50" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                {opt.swatch && <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.swatch }} />}
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto"><Check className="h-3 w-3" /></SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function ToggleRow({ value, onValueChange, options }: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onValueChange(v); }}
      className="flex w-full rounded-md border border-input overflow-hidden"
    >
      {options.map((opt) => (
        <ToggleGroupPrimitive.Item
          key={opt.value}
          value={opt.value}
          className="flex-1 px-2 py-1 text-xs transition-colors hover:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {opt.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
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

  const presetOptions = THEME_PRESET_OPTIONS.map((p) => ({
    value: p.value,
    label: p.label,
    swatch: resolvedThemeMode === 'dark' ? p.primary.dark : p.primary.light,
  }));

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <IconButton aria-label="Layout preferences"><Settings className="h-4 w-4" /></IconButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none"
        >
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <h4 className="font-medium text-sm leading-none">Preferences</h4>
              <p className="text-muted-foreground text-xs">Customize your dashboard layout preferences.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Theme Preset</Label>
                <SimpleSelect value={values.theme_preset} onValueChange={set('theme_preset')} options={presetOptions} />
              </div>
              <div className="space-y-1">
                <Label>Fonts</Label>
                <SimpleSelect value={values.font} onValueChange={set('font')} options={fontOptions.map((f) => ({ value: f.key, label: f.label }))} />
              </div>
              <div className="space-y-1">
                <Label>Theme Mode</Label>
                <ToggleRow value={values.theme_mode} onValueChange={set('theme_mode')} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
              </div>
              <div className="space-y-1">
                <Label>Page Layout</Label>
                <ToggleRow value={values.content_layout} onValueChange={set('content_layout')} options={[{ value: 'centered', label: 'Centered' }, { value: 'full-width', label: 'Full Width' }]} />
              </div>
              <div className="space-y-1">
                <Label>Navbar Behavior</Label>
                <ToggleRow value={values.navbar_style} onValueChange={set('navbar_style')} options={[{ value: 'sticky', label: 'Sticky' }, { value: 'scroll', label: 'Scroll' }]} />
              </div>
              <div className="space-y-1">
                <Label>Sidebar Style</Label>
                <ToggleRow value={values.sidebar_variant} onValueChange={set('sidebar_variant')} options={[{ value: 'inset', label: 'Inset' }, { value: 'sidebar', label: 'Sidebar' }, { value: 'floating', label: 'Floating' }]} />
              </div>
              <div className="space-y-1">
                <Label>Sidebar Collapse</Label>
                <ToggleRow value={values.sidebar_collapsible} onValueChange={set('sidebar_collapsible')} options={[{ value: 'icon', label: 'Icon' }, { value: 'offcanvas', label: 'OffCanvas' }]} />
              </div>
              <button
                type="button"
                onClick={resetPreferences}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Restore Defaults
              </button>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
