import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { AlertDetailPanel } from '@/components/uncip/alert/AlertDetailPanel';
import { AlertActionPanel } from '@/components/uncip/alert/AlertActionPanel';
import { AlertTypeBadge } from '@/components/uncip/alert/AlertTypeBadge';
import { AlertStatusBadge } from '@/components/uncip/alert/AlertStatusBadge';
import { MediaList } from '@/components/uncip/media/MediaList';
import { AlertMediaUpload } from '@/components/uncip/media/AlertMediaUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RequestUploadInput, UNCIPMediaRow } from '@unami/api';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const alertRes = await client?.alerts.get(id).catch(() => null);
  if (!alertRes?.data) notFound();

  const alert = alertRes.data;
  const child = session?.role !== 'community'
    ? await client?.children.get(alert.childId).then((r) => r.data).catch(() => null) ?? null
    : null;

  const childName = child ? `${child.firstName} ${child.lastName}` : null;

  // Alert-level media — not shown to community
  const alertMedia: UNCIPMediaRow[] = session && session.role !== 'community'
    ? await client?.media.listAlertMedia(id).then((r) => r.data).catch(() => []) ?? []
    : [];

  // Timeline media — keyed by entry id
  const timelineEntries = alert.uncipAlertTimeline ?? [];
  const timelineMedia: Record<string, UNCIPMediaRow[]> = {};
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
    const sightingLat      = String(formData.get('sightingLat') ?? '').trim();
    const sightingLng      = String(formData.get('sightingLng') ?? '').trim();
    if (action === 'change_status') {
      const newStatus  = formData.get('newStatus') as 'resolved' | 'cancelled' | 'false_alarm';
      const statusNote = String(formData.get('statusNote') ?? '').trim() || null;
      await c.alerts.changeStatus(alertId, { status: newStatus, note: statusNote }).catch(() => null);
    } else {
      await c.timeline.add({
        alertId, action: action as never, note, caseNumber, sightingLocation,
        sightingLat: sightingLat ? parseFloat(sightingLat) : null,
        sightingLng: sightingLng ? parseFloat(sightingLng) : null,
      }).catch(() => null);
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
  const isCommunity = session?.role === 'community';

  // Page header description — status + type visible immediately (F1/F10)
  const headerDescription = (
    <div className="flex items-center gap-2 flex-wrap">
      <AlertStatusBadge status={alert.status} />
      <AlertTypeBadge alertType={alert.alertType} />
      <span className="text-sm text-muted-foreground">
        Raised {new Date(alert.createdAt).toLocaleDateString()}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={childName ?? (isCommunity ? 'Active incident' : 'Incident')}
        description={headerDescription as unknown as string}
        actions={
          <div className="flex items-center gap-2">
            {child && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/children/${child.id}`}>Child record</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/alerts">← Alerts</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-4">

        {/* Community notice — intentional privacy, not broken UI (F5) */}
        {isCommunity && (
          <div className="rounded-md border border-muted bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Child identity information is protected. You can contribute sighting information below.
          </div>
        )}

        {/* Core incident panel — status, last seen, resolution, timeline */}
        <AlertDetailPanel
          alert={alert}
          child={child}
          currentUserId={session?.id}
          currentRole={session?.role}
          timelineMedia={timelineMedia}
          onRequestTimelineUpload={handleRequestTimelineUpload}
        />

        {/* Actions — before evidence, because active response takes priority */}
        {session && (
          <AlertActionPanel
            alertId={alert.id}
            currentStatus={alert.status}
            role={session.role}
            onAction={handleAction}
          />
        )}

        {/* Incident-level evidence — non-community only (F7) */}
        {session && !isCommunity && (alertMedia.length > 0 || canUploadAlertMedia) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Incident documents</CardTitle>
              <p className="text-xs text-muted-foreground">
                Evidence attached to this incident — not to a specific action.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <MediaList rows={alertMedia} bucket="alert-media" />
              {canUploadAlertMedia && alert.status === 'active' && (
                <AlertMediaUpload onRequestUpload={handleRequestAlertUpload} />
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
