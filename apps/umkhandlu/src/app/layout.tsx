import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeBootScript } from '@/scripts/theme-boot';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';
import { fontVars } from '@/lib/fonts/registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unami Control Centre',
  description: 'Governance intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } = PREFERENCE_DEFAULTS;

  return (
    <html
      lang="en"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
