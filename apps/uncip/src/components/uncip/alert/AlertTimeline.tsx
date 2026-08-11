import { ALERT_TIMELINE_ACTION_LABELS, UNCIP_ROLE_LABELS, type AlertTimelineEntry, type UserRecord } from '@/domain/uncip/types';

interface Props {
  entries: AlertTimelineEntry[];
  /** Resolved user records for actor lookup. Keyed by userId. */
  users: Record<string, UserRecord>;
}

export function AlertTimeline({ entries, users }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline entries.</p>;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <ol className="relative border-l border-border space-y-6 pl-6">
      {sorted.map((entry) => {
        const actor = users[entry.actorId];
        return (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-background" />
            <p className="text-sm font-medium">{ALERT_TIMELINE_ACTION_LABELS[entry.action]}</p>
            <p className="text-xs text-muted-foreground">
              {actor?.name ?? entry.actorId} · {UNCIP_ROLE_LABELS[entry.actorRole]} ·{' '}
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
