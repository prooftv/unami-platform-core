import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { ParticipationForm } from '@/components/ParticipationForm';
import { fetchWeather } from '@/lib/weather';

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
  const [moment, evidence, recordsResult] = await Promise.all([
    api.moments.get(id).catch(() => null),
    api.evidence.list(id).catch(() => []),
    api.records.list({ momentId: id, limit: 50 }).catch(() => null),
  ]);
  if (!moment) notFound();

  const records = recordsResult?.data ?? [];

  // Fire-and-forget weather capture — server side only, never blocks render
  const weather = await fetchWeather(moment.region, moment.createdAt).catch(() => null);

  const waText = encodeURIComponent(`${moment.title}\n\n${moment.content}`);
  const waShareUrl = `https://wa.me/?text=${waText}`;

  const TYPE_LABELS: Record<string, string> = {
    standard: 'Standard',
    community: 'Community Notice',
    opportunity: 'Opportunity',
    infrastructure: 'Infrastructure Update',
    consultation: 'Public Consultation',
  };

  const RECORD_TYPE_LABELS: Record<string, string> = {
    'community-meeting':         'Community Meeting',
    'community-decision':        'Community Decision',
    'community-report':          'Community Report',
    'community-concern':         'Community Concern',
    'community-outcome':         'Community Outcome',
    'infrastructure-update':     'Infrastructure Update',
    'infrastructure-completion': 'Infrastructure Completion',
    'community-policy':          'Community Policy',
  };

  const RECORD_STATUS_LABEL: Record<string, string> = {
    pending: 'Pending', adopted: 'Adopted', approved: 'Approved',
    resolved: 'Resolved', rejected: 'Rejected',
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

      {evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evidence</p>
          <ul className="space-y-1.5">
            {evidence.map((item) => (
              <li key={item.id}>
                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span className="shrink-0">📎</span>
                  <span className="truncate">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {records.length > 0 && ['community', 'infrastructure', 'consultation'].includes(moment.momentType ?? '') && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Community Timeline</p>
          <ol className="space-y-3">
            {records.map((record) => (
              <li key={record.id} className="rounded-md border px-4 py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {RECORD_TYPE_LABELS[record.type] ?? record.type}
                  </span>
                  <span className="text-xs rounded-full border px-2 py-0.5 shrink-0">
                    {RECORD_STATUS_LABEL[record.status] ?? record.status}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug">{record.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {record.content.slice(0, 200)}{record.content.length > 200 ? '…' : ''}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                  <time>{new Date(record.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  <Link
                    href={`/moments/${id}/records/${record.id}`}
                    className="text-primary hover:underline"
                  >
                    View full record →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {weather && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">
            {weather.type === 'historical' ? 'Weather at time of publication' : 'Forecast for publication date'}
          </p>
          <p>
            {weather.condition} · {weather.temperatureCelsius}°C
            ({weather.tempMinCelsius}–{weather.tempMaxCelsius}°C) ·
            Rain {weather.rainfallMm} mm · Wind {weather.windKmh} km/h · UV {weather.uvIndex}
          </p>
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
