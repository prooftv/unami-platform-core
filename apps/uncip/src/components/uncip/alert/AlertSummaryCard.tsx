import { Card, CardContent } from '@/components/ui/card';
import type { UNCIPAlert, UNCIPChild } from '@unami/api';
import { AlertTypeBadge } from './AlertTypeBadge';
import { AlertStatusBadge } from './AlertStatusBadge';

interface Props {
  alert: UNCIPAlert;
  child: UNCIPChild | null;
  isCommunity?: boolean;
}

export function AlertSummaryCard({ alert, child, isCommunity = false }: Props) {
  // F5: community sees intentional privacy label, not "Unknown child"
  const title = isCommunity
    ? `${alert.alertType === 'missing' ? 'Missing child' : alert.alertType === 'medical' ? 'Medical emergency' : alert.alertType === 'danger' ? 'Child in danger' : 'Alert'} · identity protected`
    : (child ? `${child.firstName} ${child.lastName}` : 'Unknown child');

  return (
    <Card className={alert.status !== 'active' ? 'opacity-60' : undefined}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="text-sm text-muted-foreground truncate">
            Last seen {new Date(alert.lastSeenAt).toLocaleDateString()} · {alert.lastSeenLocation}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AlertTypeBadge alertType={alert.alertType} />
          <AlertStatusBadge status={alert.status} />
        </div>
      </CardContent>
    </Card>
  );
}
