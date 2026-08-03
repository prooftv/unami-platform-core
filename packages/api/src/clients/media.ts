import { apiFetch, type ApiConfig } from '../http';

export interface MediaRecord {
  id: string;
  momentId: string | null;
  messageId: string | null;
  mediaType: 'image' | 'audio' | 'video' | 'document';
  originalUrl: string | null;
  storagePath: string | null;
  fileSize: number;
  mimeType: string | null;
  processed: boolean;
  createdAt: string;
}

export interface UploadMediaResult {
  id: string;
  url: string;
  storagePath: string;
  mediaType: string;
}

export function createMediaClient(config: ApiConfig) {
  return {
    list(params?: { moment_id?: string; message_id?: string }): Promise<{ data: MediaRecord[] }> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/media${qs}`);
    },

    async upload(file: File, momentId?: string): Promise<UploadMediaResult> {
      const form = new FormData();
      form.append('file', file);
      if (momentId) form.append('moment_id', momentId);
      const res = await fetch(`${config.baseUrl}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? 'Upload failed');
      }
      return res.json();
    },

    delete(id: string): Promise<{ success: boolean }> {
      return apiFetch(config, `/media/${id}`, { method: 'DELETE' });
    },
  };
}
