import { Badge } from '@/components/ui/badge';
import { ALERT_STATUS_LABELS, type AlertStatus } from '@/domain/uncip/types';

const STATUS_VARIANT: Record<AlertStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'destructive',
  resolved: 'secondary',
  cancelled: 'outline',
  false_alarm: 'outline',
};

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{ALERT_STATUS_LABELS[status]}</Badge>;
}
