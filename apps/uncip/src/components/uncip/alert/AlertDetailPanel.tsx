import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UNCIPAlert, UNCIPChild, UNCIPMediaRow, RequestUploadInput } from '@unami/api';
import type { UNCIPRole } from '@/domain/uncip/types';
import { AlertTypeBadge } from './AlertTypeBadge';
import { AlertStatusBadge } from './AlertStatusBadge';
import { AlertTimeline } from './AlertTimeline';

interface Props {
  alert: UNCIPAlert;
  child: UNCIPChild | null;
  currentUserId?: string;
  currentRole?: UNCIPRole;
  timelineMedia?: Record<string, UNCIPMediaRow[]>;
  onRequestTimelineUpload?: (
    timelineEntryId: string,
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ) => Promise<{ uploadUrl: string } | { error: string }>;
}

export function AlertDetailPanel({
  alert,
  child,
  currentUserId,
  currentRole,
  timelineMedia,
  onRequestTimelineUpload,
}: Props) {
  const timeline = alert.uncipAlertTimeline ?? [];

  return (
    <div className="space-y-4">

      {/* 1. Incident identity — status + type immediately visible */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertStatusBadge status={alert.status} />
            <AlertTypeBadge alertType={alert.alertType} />
          </div>
          <p className="text-sm">{alert.description}</p>
          <p className="text-sm text-muted-foreground">Contact: {alert.contactPhone}</p>
        </CardContent>
      </Card>

      {/* 2. Last seen — spatial context of the incident */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Last seen</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1 pt-0">
          <p className="font-medium">{new Date(alert.lastSeenAt).toLocaleString()}</p>
          <p>{alert.lastSeenLocation}</p>
          {alert.lastSeenWearing && (
            <p className="text-muted-foreground">Wearing: {alert.lastSeenWearing}</p>
          )}
          {alert.lastSeenLat != null && alert.lastSeenLng != null && (
            <p className="text-xs text-muted-foreground font-mono">
              {alert.lastSeenLat.toFixed(5)}, {alert.lastSeenLng.toFixed(5)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 3. Resolution — shown immediately after last-seen for closed incidents */}
      {alert.resolvedAt && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="pt-5 text-sm space-y-1">
            <p className="font-semibold text-green-800 dark:text-green-300">Incident resolved</p>
            <p className="text-muted-foreground">{new Date(alert.resolvedAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      {/* 4. Incident story — the chronological institutional record */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Incident story</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <AlertTimeline
            entries={timeline}
            currentUserId={currentUserId}
            currentRole={currentRole}
            alertStatus={alert.status}
            timelineMedia={timelineMedia}
            onRequestTimelineUpload={onRequestTimelineUpload}
          />
        </CardContent>
      </Card>

    </div>
  );
}
