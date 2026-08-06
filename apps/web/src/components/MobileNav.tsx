'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/projects', label: 'Projects' },
  { href: '/intelligence', label: 'Intelligence' },
  { href: '/search', label: 'Search' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/authority', label: 'Authority' },
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 right-0 z-50 w-72 bg-background border-l shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <span className="font-semibold tracking-tight">Moments</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t">
              <Link
                href="/subscribe"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Subscribe via WhatsApp
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
