'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, Separator, THEME_PRESET_OPTIONS } from '@moments/ui';
import { useThemeMode, useThemePreset, useContentLayout, useSidebarCollapsible } from '@/lib/preferences/client';

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-input overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={
            'flex-1 px-3 py-1.5 text-xs font-medium transition-colors ' +
            (value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [themeMode, setThemeMode] = useThemeMode();
  const [themePreset, setThemePreset] = useThemePreset();
  const [contentLayout, setContentLayout] = useContentLayout();
  const [collapsed, setCollapsed] = useSidebarCollapsible();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay so the open-click doesn't immediately close
    const id = setTimeout(() => document.addEventListener('pointerdown', onPointer), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Preferences"
        className="fixed right-0 top-0 z-50 h-full w-80 bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <span className="text-sm font-semibold">Preferences</span>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close preferences"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Appearance */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>

            <div className="space-y-2">
              <p className="text-sm font-medium">Theme</p>
              <SegmentedControl
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'System', value: 'system' },
                ] as const}
                value={themeMode}
                onChange={setThemeMode}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Preset</p>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESET_OPTIONS.map((preset) => {
                  const isActive = themePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => setThemePreset(preset.value)}
                      className={
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ' +
                        (isActive
                          ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground')
                      }
                    >
                      {/* Colour swatch */}
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                        style={{ background: preset.primary.light }}
                      />
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <Separator />

          {/* Layout */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</p>

            <div className="space-y-2">
              <p className="text-sm font-medium">Content Width</p>
              <SegmentedControl
                options={[
                  { label: 'Centered', value: 'centered' },
                  { label: 'Full Width', value: 'full-width' },
                ] as const}
                value={contentLayout}
                onChange={setContentLayout}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sidebar</p>
              <SegmentedControl
                options={[
                  { label: 'Expanded', value: 'expanded' },
                  { label: 'Collapsed', value: 'collapsed' },
                ] as const}
                value={collapsed ? 'collapsed' : 'expanded'}
                onChange={(v) => setCollapsed(v === 'collapsed')}
              />
            </div>
          </section>

          <Separator />

          {/* About */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</p>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {[
                  { label: 'Version', value: 'v0.2.0' },
                  { label: 'Environment', value: process.env.NODE_ENV ?? 'production' },
                  { label: 'Project', value: 'dpydmpydyfrrdhuezvgi' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
