import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { ParticipationForm } from '@/components/ParticipationForm';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const api = getPublicApiClient();
  const moment = await api.moments.get(id).catch(() => null);
  if (!moment) return { title: 'Moment not found' };
  return { title: moment.title, description: moment.content.slice(0, 160) };
}

export default async function MomentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = getPublicApiClient();
  const moment = await api.moments.get(id).catch(() => null);
  if (!moment) notFound();

  const waText = encodeURIComponent(`${moment.title}\n\n${moment.content}`);
  const waShareUrl = `https://wa.me/?text=${waText}`;

  const TYPE_LABELS: Record<string, string> = {
    standard: 'Standard',
    community: 'Community Notice',
    opportunity: 'Opportunity',
    infrastructure: 'Infrastructure Update',
    consultation: 'Public Consultation',
  };

  const isConsultation = moment.momentType === 'consultation';
  const participationOpen =
    isConsultation &&
    moment.participationEnabled &&
    (!moment.participationDeadline || new Date(moment.participationDeadline) > new Date());
  const deadlinePassed =
    isConsultation &&
    moment.participationEnabled &&
    !!moment.participationDeadline &&
    new Date(moment.participationDeadline) < new Date();

  return (
    <article className="space-y-6 max-w-2xl">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href={`/region/${moment.region}`} className="hover:text-foreground transition-colors font-medium">
            {moment.region}
          </Link>
          <span>·</span>
          <Link href={`/category/${moment.category}`} className="hover:text-foreground transition-colors">
            {moment.category}
          </Link>
          {moment.momentType !== 'standard' && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
              {TYPE_LABELS[moment.momentType] ?? moment.momentType}
            </span>
          )}
          <span>·</span>
          <time>{new Date(moment.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        </div>
        <h1 className="text-2xl font-semibold leading-snug tracking-tight">{moment.title}</h1>
      </div>

      {isConsultation && moment.participationEnabled && (
        <div className="space-y-3">
          {participationOpen && (
            <>
              {moment.participationDeadline && (
                <p className="text-xs text-muted-foreground">
                  Response window closes{' '}
                  {new Date(moment.participationDeadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <ParticipationForm momentId={moment.id} momentTitle={moment.title} />
            </>
          )}
          {deadlinePassed && (
            <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              The response window for this consultation has closed.
            </div>
          )}
        </div>
      )}

      {moment.isSponsored && moment.sponsor && (
        <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          In partnership with <span className="font-medium text-foreground">{moment.sponsor.displayName}</span>
        </div>
      )}

      <div className="prose prose-sm max-w-none text-foreground">
        {moment.content.split('\n').map((line, i) => (
          <p key={i} className="mb-3 last:mb-0 leading-relaxed">{line}</p>
        ))}
      </div>

      {moment.mediaUrls && moment.mediaUrls.length > 0 && (
        <div className="space-y-3">
          {moment.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg w-full object-cover max-h-96" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t">
        <a
          href={waShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Share on WhatsApp
        </a>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← All moments
        </Link>
      </div>
    </article>
  );
}
