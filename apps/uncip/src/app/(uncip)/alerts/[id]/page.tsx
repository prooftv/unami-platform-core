import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { AlertDetailPanel } from '@/components/uncip/alert/AlertDetailPanel';
import { AlertActionPanel } from '@/components/uncip/alert/AlertActionPanel';
import { MediaList } from '@/components/uncip/media/MediaList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RequestUploadInput } from '@unami/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const alertRes = await client?.alerts.get(id).catch(() => null);
  if (!alertRes?.data) notFound();

  const alert = alertRes.data;
  const child = await client?.children.get(alert.childId).then((r) => r.data).catch(() => null) ?? null;
  const childName = child ? `${child.firstName} ${child.lastName}` : 'Unknown child';

  // Fetch alert-level media (non-community only)
  const alertMedia = session && session.role !== 'community'
    ? await client?.media.listAlertMedia(id).then((r) => r.data).catch(() => []) ?? []
    : [];

  // Fetch timeline media for all entries (keyed by entry id)
  const timelineEntries = alert.uncipAlertTimeline ?? [];
  const timelineMedia: Record<string, import('@unami/api').UNCIPMediaRow[]> = {};
  if (session && timelineEntries.length > 0) {
    await Promise.all(
      timelineEntries.map(async (entry) => {
        const rows = await client?.media.listTimelineMedia(entry.id).then((r) => r.data).catch(() => []) ?? [];
        if (rows.length > 0) timelineMedia[entry.id] = rows;
      }),
    );
  }

  async function handleAction(formData: FormData) {
    'use server';
    const c = await getUNCIPClient();
    if (!c) return;

    const action           = String(formData.get('action') ?? '');
    const alertId          = String(formData.get('alertId') ?? '');
    const note             = String(formData.get('note') ?? '').trim() || null;
    const caseNumber       = String(formData.get('caseNumber') ?? '').trim() || null;
    const sightingLocation = String(formData.get('sightingLocation') ?? '').trim() || null;
    const sightingLatRaw   = String(formData.get('sightingLat') ?? '').trim();
    const sightingLngRaw   = String(formData.get('sightingLng') ?? '').trim();
    const sightingLat      = sightingLatRaw ? parseFloat(sightingLatRaw) : null;
    const sightingLng      = sightingLngRaw ? parseFloat(sightingLngRaw) : null;

    if (action === 'change_status') {
      const newStatus  = formData.get('newStatus') as 'resolved' | 'cancelled' | 'false_alarm';
      const statusNote = String(formData.get('statusNote') ?? '').trim() || null;
      await c.alerts.changeStatus(alertId, { status: newStatus, note: statusNote }).catch(() => null);
    } else {
      await c.timeline.add({ alertId, action: action as never, note, caseNumber, sightingLocation, sightingLat, sightingLng }).catch(() => null);
    }

    redirect(`/alerts/${alertId}`);
  }

  async function handleRequestAlertUpload(
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ): Promise<{ uploadUrl: string } | { error: string }> {
    'use server';
    const c = await getUNCIPClient();
    if (!c) return { error: 'Not authenticated' };
    try {
      const res = await c.media.requestUpload({ scope: 'alert', alertId: id, mimeType: mime, fileSize: size, label });
      return { uploadUrl: res.data.uploadUrl };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Upload request failed' };
    }
  }

  async function handleRequestTimelineUpload(
    timelineEntryId: string,
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ): Promise<{ uploadUrl: string } | { error: string }> {
    'use server';
    const c = await getUNCIPClient();
    if (!c) return { error: 'Not authenticated' };
    try {
      const res = await c.media.requestUpload({ scope: 'timeline', alertId: id, timelineEntryId, mimeType: mime, fileSize: size, label });
      return { uploadUrl: res.data.uploadUrl };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Upload request failed' };
    }
  }

  const canUploadAlertMedia = session && ['admin', 'parent', 'authority'].includes(session.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Alert — ${childName}`}
        description={`Raised ${new Date(alert.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            {child && (
              <Button variant="outline" asChild>
                <Link href={`/children/${child.id}`}>View Child Record</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/alerts">← Back to Alerts</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-4">
        <AlertDetailPanel
          alert={alert}
          child={child}
          users={{}}
          currentUserId={session?.id}
          currentRole={session?.role}
          timelineMedia={timelineMedia}
          onRequestTimelineUpload={handleRequestTimelineUpload}
        />

        {/* Alert-level media */}
        {session && session.role !== 'community' && (alertMedia.length > 0 || canUploadAlertMedia) && (
          <Card>
            <CardHeader><CardTitle>Documents &amp; Attachments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <MediaList rows={alertMedia} bucket="alert-media" />
              {canUploadAlertMedia && alert.status === 'active' && (
                <AlertMediaUploadWrapper onRequestUpload={handleRequestAlertUpload} />
              )}
            </CardContent>
          </Card>
        )}

        {session && (
          <AlertActionPanel
            alertId={alert.id}
            currentStatus={alert.status}
            role={session.role}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  );
}

// Thin client wrapper — MediaAttachment is a client component, needs a server-action prop
// passed through a client boundary. We use a small wrapper to avoid making the whole page client.
import { AlertMediaUpload } from '@/components/uncip/media/AlertMediaUpload';

function AlertMediaUploadWrapper({
  onRequestUpload,
}: {
  onRequestUpload: (mime: RequestUploadInput['mimeType'], size: number, label: string | null) => Promise<{ uploadUrl: string } | { error: string }>;
}) {
  return <AlertMediaUpload onRequestUpload={onRequestUpload} />;
}
