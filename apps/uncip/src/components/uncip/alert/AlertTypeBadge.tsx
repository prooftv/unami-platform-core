import { Badge } from '@/components/ui/badge';
import { ALERT_TYPE_LABELS, type AlertType } from '@/domain/uncip/types';

const TYPE_VARIANT: Record<AlertType, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  missing: 'destructive',
  danger: 'destructive',
  medical: 'default',
  other: 'secondary',
};

export function AlertTypeBadge({ alertType }: { alertType: AlertType }) {
  return <Badge variant={TYPE_VARIANT[alertType]}>{ALERT_TYPE_LABELS[alertType]}</Badge>;
}
