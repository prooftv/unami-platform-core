import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Umkhandlu — Governance Intelligence',
  description: 'Governance operating platform for traditional authorities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} min-h-screen antialiased font-sans`}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
