import { ALERT_TIMELINE_ACTION_LABELS, UNCIP_ROLE_LABELS } from '@/domain/uncip/types';
import type { UserRecord, UNCIPRole } from '@/domain/uncip/types';
import type { UNCIPAlertTimelineEntry, RequestUploadInput } from '@unami/api';
import { TimelineMediaUpload } from '@/components/uncip/media/TimelineMediaUpload';
import { MediaList } from '@/components/uncip/media/MediaList';
import type { UNCIPMediaRow } from '@unami/api';

interface Props {
  entries: UNCIPAlertTimelineEntry[];
  users: Record<string, UserRecord>;
  currentUserId?: string;
  currentRole?: UNCIPRole;
  alertStatus?: string;
  timelineMedia?: Record<string, UNCIPMediaRow[]>; // keyed by timeline_entry_id
  onRequestTimelineUpload?: (
    timelineEntryId: string,
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ) => Promise<{ uploadUrl: string } | { error: string }>;
}

export function AlertTimeline({ entries, users, currentUserId, currentRole, alertStatus, timelineMedia = {}, onRequestTimelineUpload }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline entries.</p>;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Roles that may attach media to timeline entries they authored
  const TIMELINE_MEDIA_ROLES = ['admin', 'school', 'authority', 'community', 'parent'];
  const canUploadTimeline = currentRole && TIMELINE_MEDIA_ROLES.includes(currentRole) && alertStatus === 'active' && onRequestTimelineUpload;

  return (
    <ol className="relative border-l border-border space-y-6 pl-6">
      {sorted.map((entry) => {
        const actor   = users[entry.actorId];
        const media   = timelineMedia[entry.id] ?? [];
        const isOwner = entry.actorId === currentUserId;
        return (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-background" />
            <p className="text-sm font-medium">{ALERT_TIMELINE_ACTION_LABELS[entry.action]}</p>
            <p className="text-xs text-muted-foreground">
              {actor?.name ?? entry.actorId} · {UNCIP_ROLE_LABELS[entry.actorRole]} ·{' '}
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            {entry.caseNumber && (
              <p className="mt-1 text-sm font-medium">Case: {entry.caseNumber}</p>
            )}
            {entry.sightingLocation && (
              <p className="mt-1 text-sm">Sighting location: {entry.sightingLocation}</p>
            )}
            {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
            {/* Timeline media */}
            {media.length > 0 && (
              <MediaList rows={media} bucket="timeline-media" />
            )}
            {/* Upload — only for the entry's author, on active alerts */}
            {canUploadTimeline && isOwner && (
              <div className="mt-2">
                <TimelineMediaUpload
                  timelineEntryId={entry.id}
                  onRequestUpload={onRequestTimelineUpload!}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
