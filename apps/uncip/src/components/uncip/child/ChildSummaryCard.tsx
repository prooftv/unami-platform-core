import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type ChildRecord, type School } from '@/domain/uncip/types';
import { ChildStatusBadge } from './ChildStatusBadge';

function ageFromDob(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface Props {
  child: ChildRecord;
  school: School | null;
  hasActiveAlert: boolean;
}

export function ChildSummaryCard({ child, school, hasActiveAlert }: Props) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase();
  const age = ageFromDob(child.dateOfBirth);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12 shrink-0">
          {child.photoUrl && <AvatarImage src={child.photoUrl} alt={child.firstName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {child.firstName} {child.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            Age {age} · {school?.name ?? 'No school'}
          </p>
        </div>
        <ChildStatusBadge hasActiveAlert={hasActiveAlert} />
      </CardContent>
    </Card>
  );
}
