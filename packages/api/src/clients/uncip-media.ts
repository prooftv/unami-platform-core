import { apiFetch, type ApiConfig } from '../http';

export type UNCIPMediaScope = 'alert' | 'timeline';

export interface UNCIPMediaRow {
  id: string;
  alertId: string;
  timelineEntryId?: string;
  uploaderRole: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  label: string | null;
  createdAt: string;
}

export interface RequestUploadInput {
  scope: UNCIPMediaScope;
  alertId: string;
  timelineEntryId?: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  fileSize: number;
  label?: string | null;
}

export interface UploadResult {
  mediaId: string;
  uploadUrl: string;
  path: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresIn: number;
}

export function createUNCIPMediaClient(config: ApiConfig) {
  return {
    requestUpload(input: RequestUploadInput): Promise<{ data: UploadResult }> {
      return apiFetch(config, '/uncip-media/upload', {
        method: 'POST',
        body: JSON.stringify({
          scope:             input.scope,
          alert_id:          input.alertId,
          timeline_entry_id: input.timelineEntryId,
          mime_type:         input.mimeType,
          file_size:         input.fileSize,
          label:             input.label ?? null,
        }),
      });
    },

    getSignedUrl(path: string, bucket: 'alert-media' | 'timeline-media'): Promise<{ data: SignedUrlResult }> {
      const qs = new URLSearchParams({ path, bucket }).toString();
      return apiFetch(config, `/uncip-media/signed?${qs}`);
    },

    listAlertMedia(alertId: string): Promise<{ data: UNCIPMediaRow[] }> {
      return apiFetch(config, `/uncip-media/alert/${alertId}`);
    },

    listTimelineMedia(entryId: string): Promise<{ data: UNCIPMediaRow[] }> {
      return apiFetch(config, `/uncip-media/timeline/${entryId}`);
    },
  };
}
