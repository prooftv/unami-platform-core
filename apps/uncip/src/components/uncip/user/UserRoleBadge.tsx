import { Badge } from '@/components/ui/badge';
import { UNCIP_ROLE_LABELS, type UNCIPRole } from '@/domain/uncip/types';

const ROLE_VARIANT: Record<UNCIPRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  admin: 'default',
  authority: 'secondary',
  school: 'secondary',
  parent: 'outline',
  community: 'outline',
};

export function UserRoleBadge({ role }: { role: UNCIPRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{UNCIP_ROLE_LABELS[role]}</Badge>;
}
