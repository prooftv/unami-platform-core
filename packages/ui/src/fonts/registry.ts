export const FONT_CONFIG = {
  geist: { label: "Geist", variable: "--font-geist" },
  inter: { label: "Inter", variable: "--font-inter" },
  notoSans: { label: "Noto Sans", variable: "--font-noto-sans" },
  nunitoSans: { label: "Nunito Sans", variable: "--font-nunito-sans" },
  figtree: { label: "Figtree", variable: "--font-figtree" },
  roboto: { label: "Roboto", variable: "--font-roboto" },
  raleway: { label: "Raleway", variable: "--font-raleway" },
  dmSans: { label: "DM Sans", variable: "--font-dm-sans" },
  publicSans: { label: "Public Sans", variable: "--font-public-sans" },
  outfit: { label: "Outfit", variable: "--font-outfit" },
  geistMono: { label: "Geist Mono", variable: "--font-geist-mono" },
  jetBrainsMono: { label: "JetBrains Mono", variable: "--font-jetbrains-mono" },
  notoSerif: { label: "Noto Serif", variable: "--font-noto-serif" },
  robotoSlab: { label: "Roboto Slab", variable: "--font-roboto-slab" },
  merriweather: { label: "Merriweather", variable: "--font-merriweather" },
  lora: { label: "Lora", variable: "--font-lora" },
  playfairDisplay: { label: "Playfair Display", variable: "--font-playfair-display" },
} as const;

export type FontKey = keyof typeof FONT_CONFIG;

export const fontOptions = (Object.entries(FONT_CONFIG) as Array<[FontKey, (typeof FONT_CONFIG)[FontKey]]>).map(
  ([key, f]) => ({ key, label: f.label, variable: f.variable }),
);
