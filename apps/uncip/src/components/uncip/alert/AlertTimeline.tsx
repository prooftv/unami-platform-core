'use client';

import { UNCIP_ROLE_LABELS } from '@/domain/uncip/types';
import type { UNCIPRole } from '@/domain/uncip/types';
import type { UNCIPAlertTimelineEntry, RequestUploadInput } from '@unami/api';
import { TimelineMediaUpload } from '@/components/uncip/media/TimelineMediaUpload';
import type { UNCIPMediaRow } from '@unami/api';
import { EmptyState } from '@unami/ui';
import { Eye, FileText, Image } from 'lucide-react';

// ─── Action display config ────────────────────────────────────────────────────
// Maps each action to a human label and a role-colour accent.
// The accent communicates institutional provenance at a glance.

const ACTION_CONFIG: Record<string, { label: string; accent: string }> = {
  alert_raised:                { label: 'Alert raised',             accent: 'bg-destructive' },
  school_confirmed_last_seen:  { label: 'School confirmed last seen', accent: 'bg-blue-500' },
  authority_assigned_case:     { label: 'SAPS case assigned',        accent: 'bg-amber-500' },
  community_sighting_reported: { label: 'Sighting reported',         accent: 'bg-purple-500' },
  status_changed:              { label: 'Status changed',            accent: 'bg-muted-foreground' },
  note_added:                  { label: 'Note added',                accent: 'bg-muted-foreground' },
};

interface Props {
  entries: UNCIPAlertTimelineEntry[];
  currentUserId?: string;
  currentRole?: UNCIPRole;
  alertStatus?: string;
  timelineMedia?: Record<string, UNCIPMediaRow[]>;
  /** Signed URLs keyed by media row id — resolved server-side before passing down */
  timelineSignedUrls?: Record<string, string>;
  onRequestTimelineUpload?: (
    timelineEntryId: string,
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ) => Promise<{ uploadUrl: string } | { error: string }>;
}

export function AlertTimeline({
  entries,
  currentUserId,
  currentRole,
  alertStatus,
  timelineMedia = {},
  timelineSignedUrls = {},
  onRequestTimelineUpload,
}: Props) {
  if (entries.length === 0) {
    return <EmptyState title="No actions recorded yet." icon={Eye} className="py-4" />;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const canUploadTimeline =
    currentRole &&
    alertStatus === 'active' &&
    !!onRequestTimelineUpload;

  return (
    <ol className="space-y-4">
      {sorted.map((entry) => {
        const config  = ACTION_CONFIG[entry.action] ?? { label: entry.action, accent: 'bg-muted-foreground' };
        const media   = timelineMedia[entry.id] ?? [];
        const isOwner = entry.actorId === currentUserId;
        const actorLabel = entry.actorName
          ? `${entry.actorName} · ${UNCIP_ROLE_LABELS[entry.actorRole]}`
          : UNCIP_ROLE_LABELS[entry.actorRole];

        return (
          <li key={entry.id} className="flex gap-3">
            {/* Accent bar — communicates action type / institutional source */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <span className={`h-3 w-3 rounded-full shrink-0 ${config.accent}`} />
              <span className="w-px flex-1 bg-border" />
            </div>

            <div className="pb-4 min-w-0 flex-1">
              {/* Action label + timestamp */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>

              {/* Actor — role always shown, name when available */}
              <p className="text-xs text-muted-foreground mt-0.5">{actorLabel}</p>

              {/* Structured facts — rendered with visual weight */}
              {entry.caseNumber && currentRole !== 'community' && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium">
                  <span className="text-muted-foreground text-xs">Case</span>
                  {entry.caseNumber}
                </div>
              )}
              {entry.sightingLocation && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground text-xs mr-1">Sighting location</span>
                  {entry.sightingLocation}
                </div>
              )}

              {/* Narrative */}
              {entry.note && (
                <p className="mt-1.5 text-sm text-foreground/80">{entry.note}</p>
              )}

              {/* Evidence */}
              {media.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {media.map((row) => {
                    const signedUrl = timelineSignedUrls[row.id] ?? null;
                    const isImage = row.mimeType.startsWith('image/');
                    const Icon = isImage ? Image : FileText;
                    return (
                      <li key={row.id} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        {signedUrl ? (
                          <a href={signedUrl} target="_blank" rel="noopener noreferrer"
                            className="text-primary underline-offset-2 hover:underline truncate">
                            {row.label ?? row.mimeType}
                          </a>
                        ) : (
                          <span className="text-muted-foreground truncate">{row.label ?? row.mimeType}</span>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(row.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Upload — entry author only, active alerts */}
              {canUploadTimeline && isOwner && (
                <div className="mt-2">
                  <TimelineMediaUpload
                    timelineEntryId={entry.id}
                    onRequestUpload={onRequestTimelineUpload!}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
