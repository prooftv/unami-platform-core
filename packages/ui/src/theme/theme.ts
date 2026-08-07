export const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: { light: "oklch(0.205 0 0)", dark: "oklch(0.922 0 0)" },
  },
  {
    label: "Brutalist",
    value: "brutalist",
    primary: { light: "oklch(0.6489 0.237 26.9728)", dark: "oklch(0.7044 0.1872 23.1858)" },
  },
  {
    label: "Soft Pop",
    value: "soft-pop",
    primary: { light: "oklch(0.5106 0.2301 276.9656)", dark: "oklch(0.6801 0.1583 276.9349)" },
  },
  {
    label: "Tangerine",
    value: "tangerine",
    primary: { light: "oklch(0.64 0.17 36.44)", dark: "oklch(0.64 0.17 36.44)" },
  },
  {
    label: "Rose",
    value: "rose",
    primary: { light: "oklch(0.645 0.246 16.439)", dark: "oklch(0.71 0.194 13.428)" },
  },
  {
    label: "Ocean",
    value: "ocean",
    primary: { light: "oklch(0.55 0.18 240)", dark: "oklch(0.65 0.16 220)" },
  },
  {
    label: "Nord",
    value: "nord",
    primary: { light: "oklch(0.6 0.1 240)", dark: "oklch(0.68 0.09 220)" },
  },
  {
    label: "Mono",
    value: "mono",
    primary: { light: "oklch(0 0 0)", dark: "oklch(1 0 0)" },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);
export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
