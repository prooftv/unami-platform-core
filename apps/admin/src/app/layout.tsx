import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { PreferencesStoreProvider } from '@moments/ui';
import { getServerPreferences } from '@/lib/preferences/server';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Unami Platform',
  description: 'Unami Platform Core — Admin',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await getServerPreferences();

  // Inline script runs synchronously before React hydrates — prevents FOUC
  const fouc = `
(function(){
  var r = document.documentElement;
  r.setAttribute('data-theme-mode', '${prefs.themeMode}');
  r.setAttribute('data-theme-preset', '${prefs.themePreset}');
  r.setAttribute('data-font', '${prefs.font}');
  r.setAttribute('data-content-layout', '${prefs.contentLayout}');
  r.setAttribute('data-navbar-style', '${prefs.navbarStyle}');
  r.setAttribute('data-sidebar-collapsible', '${prefs.sidebarCollapsible}');
  if ('${prefs.themeMode}' === 'dark' || ('${prefs.themeMode}' === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    r.classList.add('dark');
    r.style.colorScheme = 'dark';
  }
})();
`.trim();

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full bg-background antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: fouc }} />
      </head>
      <body className="h-full bg-background text-foreground">
        <PreferencesStoreProvider
          themeMode={prefs.themeMode}
          themePreset={prefs.themePreset}
          font={prefs.font}
          contentLayout={prefs.contentLayout}
          navbarStyle={prefs.navbarStyle}
        >
          {children}
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}
