import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { getHomePage } from '@/lib/sanity/queries';

export const dynamic = 'force-dynamic';
import type { PublicMoment } from '@unami/api';
import { Category, Region } from '@/domain/moments';

export const metadata: Metadata = {
  title: 'Moments — Community Information Platform',
  description: 'Local news, community updates, and announcements from across South Africa. Delivered via WhatsApp.',
};

const CATEGORY_ICONS: Record<string, string> = {
  Education: '📚', Safety: '🛡️', Culture: '🎭', Opportunity: '💡',
  Events: '📅', Health: '❤️', Technology: '💻', Community: '🤝',
};

const REGION_LABELS: Record<string, string> = {
  KZN: 'KwaZulu-Natal', WC: 'Western Cape', GP: 'Gauteng', EC: 'Eastern Cape',
  FS: 'Free State', LP: 'Limpopo', MP: 'Mpumalanga', NC: 'Northern Cape',
  NW: 'North West', National: 'National',
};

function MomentCard({ moment, featured = false }: { moment: PublicMoment; featured?: boolean }) {
  return (
    <Link
      href={`/moments/${moment.id}`}
      className={`group block rounded-xl border bg-card transition-all hover:shadow-md hover:border-primary/20 ${featured ? 'p-6' : 'p-4'}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <span className="font-medium text-foreground">{REGION_LABELS[moment.region] ?? moment.region}</span>
        <span>·</span>
        <span>{moment.category}</span>
        {moment.urgencyLevel === 'urgent' && (
          <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 font-medium">Urgent</span>
        )}
        {moment.urgencyLevel === 'high' && (
          <span className="rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 font-medium">High</span>
        )}
        {moment.isSponsored && moment.sponsor && (
          <span className="ml-auto text-muted-foreground">Sponsored · {moment.sponsor.displayName}</span>
        )}
      </div>
      <p className={`font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors ${featured ? 'text-lg' : 'text-sm'}`}>
        {moment.title}
      </p>
      {featured && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">{moment.content}</p>
      )}
      <time className="mt-2 block text-xs text-muted-foreground">
        {new Date(moment.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
      </time>
    </Link>
  );
}

export default async function HomePage() {
  const api = getPublicApiClient();

  const [allResult, sanityHome] = await Promise.all([
    api.moments.list({ page: 1, limit: 12 }).catch(() => null),
    getHomePage().catch(() => null),
  ]);

  const moments: PublicMoment[] = allResult?.data ?? [];
  const urgentMoments = moments.filter((m) => m.urgencyLevel === 'urgent' || m.urgencyLevel === 'high').slice(0, 3);
  const heroMoment = moments[0] ?? null;
  const featuredMoments = moments.slice(1, 4);
  const latestMoments = moments.slice(4, 10);
  const sponsoredMoments = moments.filter((m) => m.isSponsored).slice(0, 3);
  const communityMoments = moments.filter((m) => m.category === 'Community').slice(0, 3);
  const authorityMoments = moments.filter((m) => m.category === 'Safety' || m.urgencyLevel === 'urgent').slice(0, 3);

  return (
    <div className="space-y-16">

      {/* 1. Urgent strip */}
      {urgentMoments.length > 0 && (
        <section>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Breaking / Urgent</p>
            <div className="space-y-1">
              {urgentMoments.map((m) => (
                <Link
                  key={m.id}
                  href={`/moments/${m.id}`}
                  className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-destructive/10 transition-colors"
                >
                  <span className="mt-0.5 shrink-0 text-destructive">●</span>
                  <span className="text-sm font-medium leading-snug">{m.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {REGION_LABELS[m.region] ?? m.region}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Hero — Sanity editorial or first moment */}
      {sanityHome?.hero && (
        <section>
          <div className="rounded-2xl border bg-card p-8">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
              {sanityHome.hero.heading}
            </h1>
            {sanityHome.hero.subheading && (
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">{sanityHome.hero.subheading}</p>
            )}
            {sanityHome.hero.ctaLabel && sanityHome.hero.ctaUrl && (
              <Link
                href={sanityHome.hero.ctaUrl}
                className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {sanityHome.hero.ctaLabel}
              </Link>
            )}
          </div>
        </section>
      )}

      {heroMoment ? (
        <section>
          <Link
            href={`/moments/${heroMoment.id}`}
            className="group block rounded-2xl border bg-card p-8 transition-all hover:shadow-lg hover:border-primary/20"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 font-medium text-xs">
                {heroMoment.category}
              </span>
              <span>{REGION_LABELS[heroMoment.region] ?? heroMoment.region}</span>
              <span>·</span>
              <time>{new Date(heroMoment.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
              {heroMoment.title}
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3 max-w-2xl">
              {heroMoment.content}
            </p>
            {heroMoment.isSponsored && heroMoment.sponsor && (
              <p className="mt-4 text-xs text-muted-foreground">
                In partnership with <span className="font-medium text-foreground">{heroMoment.sponsor.displayName}</span>
              </p>
            )}
          </Link>
        </section>
      ) : (
        <section>
          <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
            <p className="text-2xl font-bold tracking-tight">Community Moments</p>
            <p className="mt-2 text-muted-foreground">Local news and updates from across South Africa.</p>
            <Link href="/subscribe" className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Subscribe via WhatsApp
            </Link>
          </div>
        </section>
      )}

      {/* 3. Featured moments */}
      {featuredMoments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Featured</h2>
            <Link href="/feed" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {featuredMoments.map((m) => <MomentCard key={m.id} moment={m} featured />)}
          </div>
        </section>
      )}

      {/* 4. Latest updates */}
      {latestMoments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Latest Updates</h2>
            <Link href="/feed" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          <div className="divide-y rounded-xl border overflow-hidden">
            {latestMoments.map((m) => (
              <Link
                key={m.id}
                href={`/moments/${m.id}`}
                className="flex items-start gap-4 px-5 py-4 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{REGION_LABELS[m.region] ?? m.region}</span>
                    <span>·</span>
                    <span>{m.category}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{m.title}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground pt-0.5">
                  {new Date(m.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Categories */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight mb-5">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.values(Category).map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat}`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
              <span className="text-sm font-medium">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Sponsored content */}
      {sponsoredMoments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Sponsored</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Community initiatives from our partners</p>
            </div>
            <Link href="/sponsors" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Our sponsors →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {sponsoredMoments.map((m) => <MomentCard key={m.id} moment={m} />)}
          </div>
        </section>
      )}

      {/* 7. Community notices */}
      {communityMoments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Community Notices</h2>
            <Link href="/category/Community" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {communityMoments.map((m) => <MomentCard key={m.id} moment={m} />)}
          </div>
        </section>
      )}

      {/* 8. Authority updates */}
      {authorityMoments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Authority Updates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Official notices from community authorities</p>
            </div>
            <Link href="/authority" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {authorityMoments.map((m) => <MomentCard key={m.id} moment={m} />)}
          </div>
        </section>
      )}

      {/* 9. Subscribe CTA */}
      <section>
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Stay informed. No app required.</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto leading-relaxed">
            Receive community updates directly on WhatsApp. Choose your region, pick your interests, and get Moments delivered to you.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 rounded-md bg-white text-primary px-6 py-3 text-sm font-semibold hover:bg-white/90 transition-opacity"
            >
              Subscribe via WhatsApp
            </Link>
            <Link
              href="/about"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by region */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight mb-5">Browse by Region</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(Region).map((r) => (
            <Link
              key={r}
              href={`/region/${r}`}
              className="rounded-full border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {REGION_LABELS[r] ?? r}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
