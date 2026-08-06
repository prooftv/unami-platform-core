import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import { Region, Category } from '@/domain/moments';

const REGION_LABELS: Record<string, string> = {
  KZN: 'KwaZulu-Natal', WC: 'Western Cape', GP: 'Gauteng', EC: 'Eastern Cape',
  FS: 'Free State', LP: 'Limpopo', MP: 'Mpumalanga', NC: 'Northern Cape',
  NW: 'North West', National: 'National',
};

const CATEGORY_ICONS: Record<string, string> = {
  Education: '📚', Safety: '🛡️', Culture: '🎭', Opportunity: '💡',
  Events: '📅', Health: '❤️', Technology: '💻', Community: '🤝',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="text-primary">●</span>
            <span>Moments</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/feed" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Feed</Link>
            <Link href="/projects" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Projects</Link>
            <Link href="/intelligence" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Intelligence</Link>
            <Link href="/search" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Search</Link>
            <Link href="/sponsors" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Sponsors</Link>
            <Link href="/campaigns" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Campaigns</Link>
            <Link href="/authority" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Authority</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </Link>
            <ThemeToggle />
            <Link
              href="/subscribe"
              className="hidden md:inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity ml-2"
            >
              Subscribe
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 font-semibold tracking-tight mb-3">
                <span className="text-primary">●</span>
                <span>Moments</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Community information platform for South Africa. Delivered via WhatsApp.
              </p>
              <Link
                href="/subscribe"
                className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Subscribe
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Regions</p>
              <ul className="space-y-1.5">
                {Object.entries(Region).slice(0, 5).map(([, r]) => (
                  <li key={r}>
                    <Link href={`/region/${r}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {REGION_LABELS[r] ?? r}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Categories</p>
              <ul className="space-y-1.5">
                {Object.values(Category).slice(0, 5).map((c) => (
                  <li key={c}>
                    <Link href={`/category/${c}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {CATEGORY_ICONS[c]} {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform</p>
              <ul className="space-y-1.5">
                {[
                  ['/about', 'About'],
                  ['/help', 'Help'],
                  ['/sponsors', 'Sponsors'],
                  ['/campaigns', 'Campaigns'],
                  ['/authority', 'Authority'],
                  ['/privacy', 'Privacy'],
                  ['/terms', 'Terms'],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Moments. Community information platform.
            </p>
            <p className="text-xs text-muted-foreground">
              Send <code className="font-mono">STOP</code> to unsubscribe at any time. POPIA compliant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
