import { Card, CardContent } from '@/components/ui/card';
import { type AlertRecord, type ChildRecord } from '@/domain/uncip/types';
import { AlertTypeBadge } from './AlertTypeBadge';
import { AlertStatusBadge } from './AlertStatusBadge';

interface Props {
  alert: AlertRecord;
  child: ChildRecord | null;
}

export function AlertSummaryCard({ alert, child }: Props) {
  const childName = child
    ? `${child.firstName} ${child.lastName}`
    : 'Unknown child';

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{childName}</p>
          <p className="text-sm text-muted-foreground">
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
