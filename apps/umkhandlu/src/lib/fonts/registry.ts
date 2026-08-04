import { Geist, Inter, Noto_Sans, Nunito_Sans, Figtree, Roboto, Raleway, DM_Sans, Public_Sans, Outfit } from 'next/font/google';

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

export const fontRegistry = {
  geist:      { label: 'Geist',       font: geist },
  inter:      { label: 'Inter',       font: inter },
  notoSans:   { label: 'Noto Sans',   font: notoSans },
  nunitoSans: { label: 'Nunito Sans', font: nunitoSans },
  figtree:    { label: 'Figtree',     font: figtree },
  roboto:     { label: 'Roboto',      font: roboto },
  raleway:    { label: 'Raleway',     font: raleway },
  dmSans:     { label: 'DM Sans',     font: dmSans },
  publicSans: { label: 'Public Sans', font: publicSans },
  outfit:     { label: 'Outfit',      font: outfit },
} as const;

export type FontKey = keyof typeof fontRegistry;
export const fontKeys = Object.keys(fontRegistry) as FontKey[];
export const fontVars = Object.values(fontRegistry).map(({ font }) => font.variable).join(' ');
export const fontOptions = fontKeys.map((key) => ({ key, label: fontRegistry[key].label }));
