import { GUARDIAN_RELATIONSHIP_LABELS, type GuardianLink, type UserRecord } from '@/domain/uncip/types';

interface Props {
  guardians: GuardianLink[];
  /** Resolved user records for each guardian. Keyed by userId. */
  users: Record<string, UserRecord>;
}

export function GuardianList({ guardians, users }: Props) {
  if (guardians.length === 0) {
    return <p className="text-sm text-muted-foreground">No guardians registered.</p>;
  }

  return (
    <ul className="space-y-2">
      {guardians.map((g) => {
        const user = users[g.userId];
        return (
          <li key={g.id} className="flex items-center justify-between text-sm">
            <span className="font-medium">{user?.name ?? g.userId}</span>
            <span className="text-muted-foreground">
              {GUARDIAN_RELATIONSHIP_LABELS[g.relationship]}
              {g.isPrimary && ' · Primary'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
