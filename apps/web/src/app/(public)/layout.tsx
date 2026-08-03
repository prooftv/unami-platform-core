import type { ReactNode } from 'react';
import Link from 'next/link';
import { Region, Category } from '@unami/shared';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Moments
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/search" className="hover:text-foreground transition-colors">Search</Link>
            <Link href="/subscribe" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Subscribe
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Moments</span>
            <span>Community information platform</span>
            <span>South Africa</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {Object.values(Region).map((r) => (
              <Link key={r} href={`/region/${r}`} className="hover:text-foreground transition-colors">{r}</Link>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {Object.values(Category).map((c) => (
              <Link key={c} href={`/category/${c}`} className="hover:text-foreground transition-colors">{c}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
