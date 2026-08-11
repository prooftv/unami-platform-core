import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UNCIPAlert, UNCIPChild } from '@unami/api';
import type { UserRecord } from '@/domain/uncip/types';
import { AlertTypeBadge } from './AlertTypeBadge';
import { AlertStatusBadge } from './AlertStatusBadge';
import { AlertTimeline } from './AlertTimeline';

interface Props {
  alert: UNCIPAlert;
  child: UNCIPChild | null;
  users: Record<string, UserRecord>;
}

export function AlertDetailPanel({ alert, child, users }: Props) {
  const childName = child ? `${child.firstName} ${child.lastName}` : 'Unknown child';
  const timeline  = alert.uncipAlertTimeline ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{childName}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTypeBadge alertType={alert.alertType} />
            <AlertStatusBadge status={alert.status} />
          </div>
          <p className="text-sm">{alert.description}</p>
          <p className="text-sm text-muted-foreground">Contact: {alert.contactPhone}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Last Seen</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>{new Date(alert.lastSeenAt).toLocaleString()}</p>
          <p>{alert.lastSeenLocation}</p>
          {alert.lastSeenWearing && <p>Wearing: {alert.lastSeenWearing}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <AlertTimeline entries={timeline} users={users} />
        </CardContent>
      </Card>

      {alert.resolvedAt && (
        <Card>
          <CardHeader><CardTitle>Resolution</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>Resolved {new Date(alert.resolvedAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
