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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WireRecord = Record<string, any>;

function fromWireRow(r: WireRecord): UNCIPMediaRow {
  return {
    id:              r.id,
    alertId:         r.alert_id,
    timelineEntryId: r.timeline_entry_id ?? undefined,
    uploaderRole:    r.uploader_role,
    storagePath:     r.storage_path,
    mimeType:        r.mime_type,
    fileSize:        r.file_size,
    label:           r.label ?? null,
    createdAt:       r.created_at,
  };
}

function fromWireUploadResult(r: WireRecord): UploadResult {
  return {
    mediaId:   r.media_id,
    uploadUrl: r.upload_url,
    path:      r.path,
  };
}

function fromWireSignedUrl(r: WireRecord): SignedUrlResult {
  return {
    signedUrl: r.signed_url,
    expiresIn: r.expires_in,
  };
}

export function createUNCIPMediaClient(config: ApiConfig) {
  return {
    requestUpload(input: RequestUploadInput): Promise<{ data: UploadResult }> {
      return apiFetch<{ data: WireRecord }>(config, '/uncip-media/upload', {
        method: 'POST',
        body: JSON.stringify({
          scope:             input.scope,
          alert_id:          input.alertId,
          timeline_entry_id: input.timelineEntryId,
          mime_type:         input.mimeType,
          file_size:         input.fileSize,
          label:             input.label ?? null,
        }),
      }).then(r => ({ data: fromWireUploadResult(r.data) }));
    },

    getSignedUrl(path: string, bucket: 'alert-media' | 'timeline-media'): Promise<{ data: SignedUrlResult }> {
      const qs = new URLSearchParams({ path, bucket }).toString();
      return apiFetch<{ data: WireRecord }>(config, `/uncip-media/signed?${qs}`)
        .then(r => ({ data: fromWireSignedUrl(r.data) }));
    },

    listAlertMedia(alertId: string): Promise<{ data: UNCIPMediaRow[] }> {
      return apiFetch<{ data: WireRecord[] }>(config, `/uncip-media/alert/${alertId}`)
        .then(r => ({ data: r.data.map(fromWireRow) }));
    },

    listTimelineMedia(entryId: string): Promise<{ data: UNCIPMediaRow[] }> {
      return apiFetch<{ data: WireRecord[] }>(config, `/uncip-media/timeline/${entryId}`)
        .then(r => ({ data: r.data.map(fromWireRow) }));
    },
  };
}
