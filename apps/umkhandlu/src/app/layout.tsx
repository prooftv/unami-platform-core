import type { Metadata } from 'next';
import { Geist, Inter, Noto_Sans, Nunito_Sans, Figtree, Roboto, Raleway, DM_Sans, Public_Sans, Outfit } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeBootScript } from '@/scripts/theme-boot';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import './globals.css';

const geist      = Geist({ subsets: ['latin'], variable: '--font-geist' });
const inter      = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSans   = Noto_Sans({ subsets: ['latin'], variable: '--font-noto-sans' });
const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito-sans' });
const figtree    = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const roboto     = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto' });
const raleway    = Raleway({ subsets: ['latin'], variable: '--font-raleway' });
const dmSans     = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' });
const outfit     = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

const fontVars = [geist, inter, notoSans, nunitoSans, figtree, roboto, raleway, dmSans, publicSans, outfit]
  .map((f) => f.variable)
  .join(' ');

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
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
