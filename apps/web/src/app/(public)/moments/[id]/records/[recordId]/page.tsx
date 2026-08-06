import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}): Promise<Metadata> {
  const { recordId } = await params;
  const api = getPublicApiClient();
  const res = await api.records.get(recordId).catch(() => null);
  if (!res) return { title: 'Record not found' };
  return {
    title: res.data.title,
    description: res.data.content.slice(0, 160),
  };
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  const api = getPublicApiClient();

  const [momentRes, recordRes] = await Promise.all([
    api.moments.get(id).catch(() => null),
    api.records.get(recordId).catch(() => null),
  ]);

  if (!momentRes || !recordRes) notFound();

  const moment = momentRes;
  const record = recordRes.data;

  // Fetch parent record if lineage exists
  const parent = record.parentRecordId
    ? await api.records.get(record.parentRecordId).catch(() => null)
    : null;

  const typeLabel = RECORD_TYPE_LABELS[record.type] ?? record.type;
  const statusLabel = RECORD_STATUS_LABEL[record.status] ?? record.status;
  const weather = record.weatherContext as {
    type: string; condition: string; temperatureCelsius: number;
    tempMinCelsius: number; tempMaxCelsius: number;
    rainfallMm: number; windKmh: number; uvIndex: number;
  } | null;

  return (
    <article className="space-y-6 max-w-2xl">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link
            href={`/moments/${id}`}
            className="hover:text-foreground transition-colors"
          >
            ← {moment.title}
          </Link>
          <span>·</span>
          <span>{typeLabel}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{record.title}</h1>
          <span className="text-xs rounded-full border px-2 py-0.5 shrink-0 mt-1">{statusLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <time>
            {new Date(record.createdAt).toLocaleDateString('en-ZA', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </time>
          {record.approvedBy && (
            <> · Recorded by <span className="text-foreground">{record.approvedBy}</span></>
          )}
        </p>
      </div>

      {parent && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          This record follows from:{' '}
          <Link
            href={`/moments/${id}/records/${parent.data.id}`}
            className="text-primary hover:underline font-medium"
          >
            {parent.data.title}
          </Link>
        </div>
      )}

      <div className="prose prose-sm max-w-none text-foreground">
        {record.content.split('\n').map((line, i) => (
          <p key={i} className="mb-3 last:mb-0 leading-relaxed">{line}</p>
        ))}
      </div>

      {weather && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">
            {weather.type === 'historical' ? 'Weather at time of record' : 'Forecast for record date'}
          </p>
          <p>
            {weather.condition} · {weather.temperatureCelsius}°C
            ({weather.tempMinCelsius}–{weather.tempMaxCelsius}°C) ·
            Rain {weather.rainfallMm} mm · Wind {weather.windKmh} km/h · UV {weather.uvIndex}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t text-sm">
        <Link
          href={`/moments/${id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to moment
        </Link>
      </div>
    </article>
  );
}
