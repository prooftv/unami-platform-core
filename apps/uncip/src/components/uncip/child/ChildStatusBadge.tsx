import { Badge } from '@/components/ui/badge';

export function ChildStatusBadge({ hasActiveAlert }: { hasActiveAlert: boolean }) {
  return hasActiveAlert ? (
    <Badge variant="destructive">Active Alert</Badge>
  ) : (
    <Badge variant="outline">No Active Alert</Badge>
  );
}
